import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend, Counter } from "k6/metrics";

// ─── Custom Metrics ───────────────────────────────────────
const workflowFailRate = new Rate("workflow_failures");
const loginStepDuration = new Trend("step_login_duration", true);
const getMeStepDuration = new Trend("step_get_me_duration", true);
const getRequestsStepDuration = new Trend("step_get_requests_duration", true);
const completedWorkflows = new Counter("completed_workflows");

// ─── Test Configuration ──────────────────────────────────
const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
const TEST_TYPE = __ENV.TEST_TYPE || "load"; // "load" or "stress"

// Danh sách 20 citizen accounts
const CITIZENS = Array.from({ length: 20 }, (_, i) => ({
  email: `k6_citizen_${i + 1}@test.com`,
  password: "Test123!",
}));

// ─── Scenarios ───────────────────────────────────────────
const loadConfig = {
  stages: [
    { duration: "10s", target: 15 }, // Ramp-up
    { duration: "40s", target: 15 }, // Giữ ổn định
    { duration: "10s", target: 0 }, // Ramp-down
  ],
};

const stressConfig = {
  stages: [
    { duration: "10s", target: 15 }, // Warm-up
    { duration: "30s", target: 30 }, // Tăng dần
    { duration: "30s", target: 60 }, // Đẩy lên đỉnh
    { duration: "40s", target: 60 }, // Giữ ở đỉnh
    { duration: "10s", target: 0 }, // Ramp-down
  ],
};

export const options = {
  stages: TEST_TYPE === "stress" ? stressConfig.stages : loadConfig.stages,

  thresholds: {
    http_req_duration: ["p(95)<800"], // Tổng thể < 800ms
    http_req_failed: ["rate<0.02"], // < 2% failure rate
    step_login_duration: ["p(95)<500"], // Login step < 500ms
    step_get_me_duration: ["p(95)<200"], // Get Me step < 200ms
    step_get_requests_duration: ["p(95)<300"], // Get Requests step < 300ms
  },
};

// ─── Main Test Function ──────────────────────────────────
export default function () {
  const citizen = CITIZENS[Math.floor(Math.random() * CITIZENS.length)];
  let token = null;
  let workflowSuccess = true;

  // ── Step 1: Login ──────────────────────────────────────
  group("Step 1: Login", function () {
    const res = http.post(
      `${BASE_URL}/api/auth/login`,
      JSON.stringify({
        email: citizen.email,
        password: citizen.password,
      }),
      {
        headers: { "Content-Type": "application/json" },
        tags: { name: "POST /api/auth/login" },
      },
    );

    loginStepDuration.add(res.timings.duration);

    const loginOk = check(res, {
      "[Login] status 200": (r) => r.status === 200,
      "[Login] has token": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && body.data.accessToken !== undefined;
        } catch (e) {
          return false;
        }
      },
    });

    if (loginOk) {
      const body = JSON.parse(res.body);
      token = body.data.accessToken;
    } else {
      workflowSuccess = false;
    }
  });

  // Nghỉ 1-2s (mô phỏng user thực đang đọc trang)
  sleep(Math.random() + 1);

  // Nếu login thất bại thì dừng workflow
  if (!token) {
    workflowFailRate.add(true);
    return;
  }

  const authHeaders = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };

  // ── Step 2: Get Me (Profile) ───────────────────────────
  group("Step 2: Get Me", function () {
    const res = http.get(`${BASE_URL}/api/auth/me`, Object.assign({}, authHeaders, {
      tags: { name: "GET /api/auth/me" },
    }));

    getMeStepDuration.add(res.timings.duration);

    const meOk = check(res, {
      "[GetMe] status 200": (r) => r.status === 200,
      "[GetMe] has user data": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data && body.data.email !== undefined;
        } catch (e) {
          return false;
        }
      },
    });

    if (!meOk) {
      workflowSuccess = false;
    }
  });

  // Nghỉ 1-3s
  sleep(Math.random() * 2 + 1);

  // ── Step 3: Get My Requests ────────────────────────────
  group("Step 3: Get My Requests", function () {
    const res = http.get(`${BASE_URL}/api/requests/my?page=1&limit=10`, Object.assign({}, authHeaders, {
      tags: { name: "GET /api/requests/my" },
    }));

    getRequestsStepDuration.add(res.timings.duration);

    const reqOk = check(res, {
      "[Requests] status 200": (r) => r.status === 200,
      "[Requests] has data": (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data !== undefined;
        } catch (e) {
          return false;
        }
      },
    });

    if (!reqOk) {
      workflowSuccess = false;
    }
  });

  // Track workflow result
  workflowFailRate.add(!workflowSuccess);
  if (workflowSuccess) {
    completedWorkflows.add(1);
  }

  // Nghỉ 1s trước khi bắt đầu workflow mới
  sleep(1);
}

// ─── Test Summary ────────────────────────────────────────
export function handleSummary(data) {
  const testType = TEST_TYPE === "stress" ? "STRESS" : "LOAD";

  console.log(`\n${"═".repeat(60)}`);
  console.log(
    `---- SCENARIO 3: MIXED WORKFLOW — ${testType} TEST COMPLETE ----`,
  );
  console.log(`${"═".repeat(60)}`);
  console.log(`  Workflow: Login → Get Me → Get My Requests`);
  console.log(`  Target:   ${BASE_URL}`);
  console.log(`  Test Type: ${testType}`);
  console.log(`${"─".repeat(60)}`);

  // Per-step metrics
  const steps = [
    { name: "Login", key: "step_login_duration" },
    { name: "Get Me", key: "step_get_me_duration" },
    { name: "Get Requests", key: "step_get_requests_duration" },
  ];

  console.log(`  📊 Per-Step Response Time (p95):`);
  for (const step of steps) {
    const m = data.metrics[step.key];
    if (m) {
      console.log(
        `     ${step.name.padEnd(15)} avg: ${m.values.avg.toFixed(2)}ms  p(95): ${m.values["p(95)"].toFixed(2)}ms`,
      );
    }
  }

  const workflows = data.metrics.completed_workflows;
  if (workflows) {
    console.log(`  ✅ Completed Workflows: ${workflows.values.count}`);
  }

  const reqs = data.metrics.http_reqs;
  if (reqs) {
    console.log(`  📈 Throughput: ${reqs.values.rate.toFixed(2)} req/s`);
    console.log(`  📦 Total HTTP Requests: ${reqs.values.count}`);
  }

  const failed = data.metrics.http_req_failed;
  if (failed) {
    console.log(`  ❌ Failure Rate: ${(failed.values.rate * 100).toFixed(2)}%`);
  }

  console.log(`${"═".repeat(60)}\n`);

  return {
    stdout: textSummary(data, { indent: "  ", enableColors: true }),
  };
}

import { textSummary } from "https://jslib.k6.io/k6-summary/0.1.0/index.js";
