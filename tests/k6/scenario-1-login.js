import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// ─── Custom Metrics ───────────────────────────────────────
const loginFailRate = new Rate("login_failures");
const loginDuration = new Trend("login_duration", true);

// ─── Test Configuration ──────────────────────────────────
const BASE_URL = "http://localhost:8080";
const TEST_TYPE = "load"; // "load" or "stress"

// Danh sách 20 citizen accounts để random
const CITIZENS = Array.from({ length: 20 }, (_, i) => ({
  email: `k6_citizen_${i + 1}@test.com`,
  password: "Test123!",
}));

// ─── Scenarios ───────────────────────────────────────────
const loadConfig = {
  stages: [
    { duration: "5s", target: 10 }, // Ramp-up lên 10 VUs
    { duration: "20s", target: 10 }, // Giữ ổn định 10 VUs
    { duration: "5s", target: 0 }, // Ramp-down
  ],
};

const stressConfig = {
  stages: [
    { duration: "10s", target: 10 }, // Warm-up
    { duration: "20s", target: 25 }, // Tăng lên 25
    { duration: "20s", target: 50 }, // Đẩy lên 50
    { duration: "30s", target: 50 }, // Giữ ở đỉnh
    { duration: "10s", target: 0 }, // Ramp-down
  ],
};

export const options = {
  stages: TEST_TYPE === "stress" ? stressConfig.stages : loadConfig.stages,

  thresholds: {
    http_req_duration: ["p(95)<800"], // 95% requests < 800ms
    http_req_failed: ["rate<0.01"], // < 1% failure rate
    login_failures: ["rate<0.15"], // < 15% login failures
  },
};

// ─── Main Test Function ──────────────────────────────────
export default function () {
  // Chọn random citizen account
  const citizen = CITIZENS[Math.floor(Math.random() * CITIZENS.length)];

  const payload = JSON.stringify({
    email: citizen.email,
    password: citizen.password,
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
    tags: { name: "POST /api/auth/login" },
  };

  // Gửi request
  const res = http.post(`${BASE_URL}/api/auth/login`, payload, params);

  // Track custom metrics
  loginDuration.add(res.timings.duration);

  // Checks
  const success = check(res, {
    "status is 200": (r) => r.status === 200,
    "has accessToken": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.accessToken !== undefined;
      } catch (e) {
        return false;
      }
    },
    "response time < 800ms": (r) => r.timings.duration < 800,
  });

  loginFailRate.add(!success);

  // Nghỉ 1s giữa các iteration (mô phỏng user thật)
  sleep(1);
}

// ─── Test Summary ────────────────────────────────────────
export function handleSummary(data) {
  const testType = TEST_TYPE === "stress" ? "STRESS" : "LOAD";

  console.log(`\n${"═".repeat(60)}`);
  console.log(`-----SCENARIO 1: LOGIN API — ${testType} TEST COMPLETE-----`);
  console.log(`${"═".repeat(60)}`);
  console.log(`  Endpoint:  POST /api/auth/login`);
  console.log(`  Target:    ${BASE_URL}`);
  console.log(`  Test Type: ${testType}`);
  console.log(`${"─".repeat(60)}`);

  const duration = data.metrics.http_req_duration;
  if (duration) {
    console.log(`  📊 Response Time:`);
    console.log(`     avg:   ${duration.values.avg.toFixed(2)}ms`);
    console.log(`     p(90): ${duration.values["p(90)"].toFixed(2)}ms`);
    console.log(`     p(95): ${duration.values["p(95)"].toFixed(2)}ms`);
    console.log(`     max:   ${duration.values.max.toFixed(2)}ms`);
  }

  const reqs = data.metrics.http_reqs;
  if (reqs) {
    console.log(`  📈 Throughput: ${reqs.values.rate.toFixed(2)} req/s`);
    console.log(`  📦 Total Requests: ${reqs.values.count}`);
  }

  const failed = data.metrics.http_req_failed;
  if (failed) {
    console.log(`  ❌ Failure Rate: ${(failed.values.rate * 100).toFixed(2)}%`);
  }

  console.log(`${"═".repeat(60)}\n`);

  // Return default summary too
  return {
    stdout: textSummary(data, { indent: "  ", enableColors: true }),
  };
}

// k6 built-in text summary
import { textSummary } from "https://jslib.k6.io/k6-summary/0.1.0/index.js";
