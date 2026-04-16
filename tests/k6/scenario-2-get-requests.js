import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// ─── Custom Metrics ───────────────────────────────────────
const requestFailRate = new Rate("request_failures");
const requestDuration = new Trend("get_requests_duration", true);

// ─── Test Configuration ──────────────────────────────────
const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
const TEST_TYPE = __ENV.TEST_TYPE || "load"; // "load" or "stress"

const COORDINATOR = {
  email: "k6_coordinator@test.com",
  password: "Test123!",
};

// ─── Scenarios ───────────────────────────────────────────
const loadConfig = {
  stages: [
    { duration: "5s", target: 20 }, // Ramp-up lên 20 VUs
    { duration: "20s", target: 20 }, // Giữ ổn định 20 VUs
    { duration: "5s", target: 0 }, // Ramp-down
  ],
};

const stressConfig = {
  stages: [
    { duration: "10s", target: 20 }, // Warm-up
    { duration: "20s", target: 50 }, // Tăng lên 50
    { duration: "20s", target: 100 }, // Đẩy lên 100
    { duration: "30s", target: 100 }, // Giữ ở đỉnh
    { duration: "10s", target: 0 }, // Ramp-down
  ],
};

export const options = {
  stages: TEST_TYPE === "stress" ? stressConfig.stages : loadConfig.stages,

  thresholds: {
    http_req_duration: ["p(95)<300"], // 95% requests < 300ms
    http_req_failed: ["rate<0.01"], // < 1% failure rate
    get_requests_duration: ["p(95)<300"], // Custom metric
  },
};

// ─── Setup: Login once, share token ──────────────────────
export function setup() {
  console.log("🔑 Logging in as Coordinator to get auth token...");

  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      email: COORDINATOR.email,
      password: COORDINATOR.password,
    }),
    { headers: { "Content-Type": "application/json" } }
  );

  const loginCheck = check(loginRes, {
    "setup: login successful": (r) => r.status === 200,
  });

  if (!loginCheck) {
    console.error("❌ Setup failed: Cannot login as Coordinator");
    console.error("   Response:", loginRes.body);
    console.error("   Have you run the seed script? node tests/k6/seed-k6-data.js");
    return { token: null };
  }

  const body = JSON.parse(loginRes.body);
  const token = body.data.accessToken;
  console.log("✅ Token acquired successfully");

  return { token };
}

// ─── Main Test Function ──────────────────────────────────
export default function (data) {
  if (!data.token) {
    console.error("❌ No token available, skipping iteration");
    return;
  }

  // Random pagination parameters
  const page = Math.floor(Math.random() * 3) + 1; // page 1-3
  const limit = 10;

  const params = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.token}`,
    },
    tags: { name: "GET /api/requests" },
  };

  // Gửi request
  const res = http.get(
    `${BASE_URL}/api/requests?page=${page}&limit=${limit}`,
    params
  );

  // Track custom metrics
  requestDuration.add(res.timings.duration);

  // Checks
  const success = check(res, {
    "status is 200": (r) => r.status === 200,
    "has data array": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data !== undefined && Array.isArray(body.data);
      } catch (e) {
        return false;
      }
    },
    "has pagination info": (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.meta && body.meta.total !== undefined;
      } catch (e) {
        return false;
      }
    },
    "response time < 300ms": (r) => r.timings.duration < 300,
  });

  requestFailRate.add(!success);

  // Nghỉ 0.5-1s giữa các iteration
  sleep(Math.random() * 0.5 + 0.5);
}

// ─── Test Summary ────────────────────────────────────────
export function handleSummary(data) {
  const testType = TEST_TYPE === "stress" ? "STRESS" : "LOAD";

  console.log(`\n${"═".repeat(60)}`);
  console.log(`  🚀 SCENARIO 2: GET REQUESTS — ${testType} TEST COMPLETE`);
  console.log(`${"═".repeat(60)}`);
  console.log(`  Endpoint:  GET /api/requests?page=N&limit=10`);
  console.log(`  Target:    ${BASE_URL}`);
  console.log(`  Auth:      Coordinator token (shared)`);
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
    console.log(
      `  ❌ Failure Rate: ${(failed.values.rate * 100).toFixed(2)}%`
    );
  }

  console.log(`${"═".repeat(60)}\n`);

  return {
    stdout: textSummary(data, { indent: "  ", enableColors: true }),
  };
}

import { textSummary } from "https://jslib.k6.io/k6-summary/0.1.0/index.js";
