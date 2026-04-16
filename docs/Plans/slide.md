# Performance Testing Demo (k6)

## 🚀 Scenario 1: Login API
* **Type:** CPU-heavy (Bcrypt hashing)
* **Endpoint:** `POST /api/auth/login`
* **Load Config:** 10 Virtual Users (VUs) for 30 seconds
* **Goal:** Evaluate the performance impact of password hashing under load.
* **Success Criteria (SLA):** p(95) < 500ms

---

## 🚀 Scenario 2: Get Requests API
* **Type:** Database-heavy (MongoDB reads & indexing)
* **Endpoint:** `GET /api/requests`
* **Load Config:** 20 Virtual Users (VUs) for 30 seconds
* **Goal:** Benchmark database query speed, including pagination and Geo-spatial indexes.
* **Success Criteria (SLA):** p(95) < 300ms

---

## 🚀 Scenario 3: Mixed User Workflow
* **Type:** Real-world Simulation
* **Flow:** Login → Fetch Profile → Fetch Assigned Requests
* **Load Config:** 15 Virtual Users (VUs) for 1 minute
* **Goal:** Simulate realistic user behavior, including idle "think-time" between actions.
* **Success Criteria (SLA):** Total workflow p(95) < 800ms

---

## 🖥️ Display Modes
* **Terminal CLI:** Fast execution with raw text summaries.
* **Grafana Dashboard:** Real-time visual metrics (integrating k6 + InfluxDB + Grafana).

---

## 📊 Key Output Metrics (How to Read Results)
* **`http_req_duration` (Response Time):** The total time taken for a request. We focus on the **p(95)** value (95% of users experience this speed or faster), which is more accurate than the average.
* **`http_req_failed` (Failure Rate):** The percentage of requests that resulted in an error. The target is always **0%**.
* **`http_reqs` (Throughput):** The total number of requests completed, often expressed as requests per second (req/s). Higher is better.
* **`vus` (Virtual Users):** The number of concurrent users simulating the load at any given moment.
