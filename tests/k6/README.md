# 🚀 k6 Performance Testing — Flood Rescue Backend

## Prerequisites

1. **k6** đã được cài đặt:
   ```powershell
   k6 version
   # Expected: k6 v1.7.1 hoặc mới hơn
   ```

2. **Server** đang chạy ở `localhost:8080`:
   ```powershell
   npm run dev
   ```

3. **MongoDB** đang chạy (local hoặc Atlas)

4. **Docker Desktop** (Optional, dùng để chạy Grafana Dashboard)

---

## Quick Start (Terminal Output)

### Bước 1: Seed dữ liệu test

```powershell
node tests/k6/seed-k6-data.js
```

Tạo 22 tài khoản test:
| Account | Email | Password |
|:--------|:------|:---------|
| 20 Citizens | `k6_citizen_{1-20}@test.com` | `Test123!` |
| 1 Coordinator | `k6_coordinator@test.com` | `Test123!` |
| 1 Admin | `k6_admin@test.com` | `Test123!` |

> ⚠️ Script có thể chạy nhiều lần (idempotent) — account đã tồn tại sẽ được skip.

---

### Bước 2: Chạy Load Tests

```powershell
# Scenario 1: Login API (10 VUs, 30s)
k6 run tests/k6/scenario-1-login.js

# Scenario 2: Get All Requests (20 VUs, 30s)
k6 run tests/k6/scenario-2-get-requests.js

# Scenario 3: Mixed Workflow (15 VUs, 1 phút)
k6 run tests/k6/scenario-3-mixed-workflow.js
```

### Bước 3: Chạy Stress Tests

```powershell
# Scenario 1: Login (ramp lên 50 VUs)
k6 run --env TEST_TYPE=stress tests/k6/scenario-1-login.js

# Scenario 2: Get Requests (ramp lên 100 VUs)
k6 run --env TEST_TYPE=stress tests/k6/scenario-2-get-requests.js

```powershell
# Scenario 1: Login (ramp lên 50 VUs)
k6 run --env TEST_TYPE=stress tests/k6/scenario-1-login.js

# Scenario 2: Get Requests (ramp lên 100 VUs)
k6 run --env TEST_TYPE=stress tests/k6/scenario-2-get-requests.js

# Scenario 3: Mixed Workflow (ramp lên 60 VUs)
k6 run --env TEST_TYPE=stress tests/k6/scenario-3-mixed-workflow.js
```

---

## 📊 Grafana Dashboard (Tùy chọn)

Để demo trực quan bằng biểu đồ (Thay vì chỉ xem kết quả text ở Terminal), bạn có thể chạy Grafana và InfluxDB song song.

### Bước 1: Khởi động hệ thống báo cáo (Cần Docker)
```powershell
docker-compose -f tests/k6/docker-compose.yml up -d
```
*Điều này sẽ bật 1 database InfluxDB (port 8086) và 1 Grafana (port 3001) chạy ngầm.*

### Bước 2: Chạy test và đẩy dữ liệu lên InfluxDB
Chỉ cần thêm tham số `--out influxdb=http://localhost:8086/k6` vào bất kỳ lệnh k6 nào.

**Ví dụ:**
```powershell
k6 run --out influxdb=http://localhost:8086/k6 tests/k6/scenario-1-login.js
```

### Bước 3: Xem kết quả trên Dashboard
Mở trình duyệt truy cập:
👉 **[http://localhost:3001/d/k6-flood-rescue](http://localhost:3001/d/k6-flood-rescue)**

*(Dashboard đã được tự động setup sẵn bằng cấu hình provisioning, không cần cấu hình DB hay Import bằng tay!)*

### Bước 4: Tắt hệ thống báo cáo sau khi xong
```powershell
docker-compose -f tests/k6/docker-compose.yml down
```

---

## Kịch bản chi tiết

### Scenario 1: Login API 🔑
- **Endpoint:** `POST /api/auth/login`
- **Mô tả:** Kiểm tra hiệu năng đăng nhập (bcrypt hash nặng CPU)
- **Load:** 10 VUs đồng thời trong 30s
- **Stress:** Ramp 0 → 50 VUs trong 2 phút
- **Thresholds:** `p(95) < 500ms`, failure rate < 1%

### Scenario 2: Get All Requests 📋
- **Endpoint:** `GET /api/requests?page=N&limit=10`
- **Mô tả:** Kiểm tra hiệu năng query MongoDB có pagination
- **Auth:** 1 Coordinator token chia sẻ cho tất cả VUs
- **Load:** 20 VUs đồng thời trong 30s
- **Stress:** Ramp 0 → 100 VUs trong 2 phút
- **Thresholds:** `p(95) < 300ms`, failure rate < 1%

### Scenario 3: Mixed Workflow 🔄
- **Flow:** Login → Get Me → Get My Requests
- **Mô tả:** Mô phỏng luồng người dùng thực tế
- **Load:** 15 VUs trong 1 phút
- **Stress:** Ramp 0 → 60 VUs trong 3 phút
- **Thresholds:** `p(95) < 800ms` tổng, `p(95) < 500ms` login step

---

## Đọc kết quả

### Các chỉ số quan trọng

| Metric | Ý nghĩa | Ngưỡng tốt |
|:-------|:---------|:------------|
| `http_req_duration` (p95) | 95% request hoàn thành trong thời gian này | < 500ms |
| `http_req_failed` | Tỷ lệ request lỗi | < 1% |
| `http_reqs` (rate) | Số request/giây (throughput) | Càng cao càng tốt |
| `vus` | Số Virtual Users đang chạy | Theo config |

### Pass/Fail
- ✅ **PASS**: Tất cả thresholds đạt → hệ thống ổn định
- ❌ **FAIL**: Có threshold bị vượt → cần tối ưu

---

## Tùy chỉnh

### Đổi server URL
```powershell
k6 run --env BASE_URL=http://192.168.1.100:8080 tests/k6/scenario-1-login.js
```
