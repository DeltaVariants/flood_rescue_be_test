# 🚀 Kế hoạch Thuyết trình: Kiểm thử Hiệu năng với k6

---

## 🟢 1. OVERVIEW – Tổng quan (5 phút)

> [!NOTE]
> **Lời dẫn:** "Đầu tiên, mình sẽ giới thiệu tổng quan về k6 - công cụ mà chúng ta sẽ sử dụng để đảm bảo hệ thống luôn ổn định dưới áp lực."

### ❓ WHAT – k6 là gì?

k6 là một công cụ **kiểm thử hiệu năng (Performance Testing)** mã nguồn mở, được tối ưu hóa cho các kỹ sư phần mềm.

- **Phạm vi kiểm thử:** API (REST, GraphQL), Backend (Spring Boot, NodeJS), Website.
- **Cơ chế:** Giả lập hàng nghìn người dùng ảo (Virtual Users - VUs) truy cập đồng thời để đánh giá sức chịu tải.

### ❓ WHY – Tại sao cần dùng k6?

> "Trong thực tế, hệ thống thường không chết vì code sai, mà chết vì quá nhiều người dùng truy cập cùng lúc."

| Lợi ích                  | Chi tiết                                                   |
| :----------------------- | :--------------------------------------------------------- |
| **Đánh giá tải**         | Xác định ngưỡng user tối đa hệ thống chịu được.            |
| **Phát hiện bottleneck** | Tìm ra điểm nghẽn (DB chậm, CPU quá tải, Memory leak).     |
| **Tránh Downtime**       | Chuẩn bị cho các đợt cao điểm (Flash sale, sự kiện lớn).   |
| **Tích hợp CI/CD**       | Tự động hóa kiểm thử hiệu năng trong quy trình phát triển. |

### ❓ WHO – Ai là người sử dụng?

- **Testers:** Thực hiện kiểm thử hiệu năng độc lập.
- **Backend Devs:** Tối ưu hóa logic API và Database.
- **DevOps:** Lập kế hoạch mở rộng (scaling) hệ thống.

---

## 🟡 2. ARCHITECTURE – Kiến trúc (4 phút)

> [!NOTE]
> **Lời dẫn:** "Tiếp theo, chúng ta sẽ tìm hiểu cách k6 vận hành bên dưới lớp vỏ JavaScript."

### 🏗️ Workflow hoạt động

`Script (JS)` ➔ `Engine (Go)` ➔ `Virtual Users (VUs)` ➔ `Requests` ➔ `Server` ➔ `Metrics`

### ⭐ Ưu & Nhược điểm

| 👍 Ưu điểm (Pros)                                 | 👎 Nhược điểm (Cons)                       |
| :------------------------------------------------ | :----------------------------------------- |
| Viết script bằng JavaScript thân thiện.           | Không có giao diện đồ họa (GUI) mặc định.  |
| CLI cực kỳ nhẹ và nhanh.                          | Không hỗ trợ tốt việc kiểm thử UI/Browser. |
| Tích hợp sâu với hệ sinh thái Grafana/Prometheus. | Yêu cầu kỹ năng lập trình cơ bản.          |

---

## 🔵 3. FEATURES – Các tính năng trọng tâm (6 phút)

> [!NOTE]
> **Lời dẫn:** "Bây giờ mình sẽ đi sâu vào các chức năng giúp k6 trở nên mạnh mẽ."

1.  **Load Testing:** Kiểm tra độ ổn định của hệ thống với lượng tải dự kiến.
2.  **Stress Testing:** Tăng dần số lượng user để tìm ra giới hạn "gãy" của hệ thống.
3.  **Thresholds (Ngưỡng):** Tự động đánh giá Pass/Fail dựa trên tiêu chí (Ví dụ: _95% request phải có response time < 500ms_).
4.  **Metrics (Chỉ số):** Thu thập dữ liệu chi tiết về thời gian phản hồi, số lỗi, dung lượng truyền tải.
5.  **Integration:** Kết nối dữ liệu sang Grafana để trực quan hóa bằng biểu đồ.

---

## 🔴 4. DEMO – Trình diễn thực tế (7 phút)

> [!NOTE]
> **Lời dẫn:** "Phần này mình sẽ demo trực tiếp trên dự án Node.js/Express — hệ thống Flood Rescue & Relief."

### 🚀 Kịch bản 1: Login API (CPU-heavy — bcrypt)

- **Endpoint:** `POST /api/auth/login`
- **Load Test:** 10 VUs × 30s | **Stress Test:** ramp lên 50 VUs
- **Mục tiêu:** Kiểm tra hiệu năng bcrypt hashing dưới tải cao.
- **Thresholds:** `p(95) < 500ms`, failure rate < 1%

### 🚀 Kịch bản 2: Get All Requests (DB-heavy — MongoDB Query)

- **Endpoint:** `GET /api/requests?page=N&limit=10`
- **Load Test:** 20 VUs × 30s | **Stress Test:** ramp lên 100 VUs
- **Mục tiêu:** Đánh giá hiệu năng MongoDB query với pagination và GeoJSON index.
- **Thresholds:** `p(95) < 300ms`, failure rate < 1%

### 🚀 Kịch bản 3: Mixed Workflow (Real User Flow)

- **Flow:** Login → Get Me → Get My Requests
- **Load Test:** 15 VUs × 1 phút | **Stress Test:** ramp lên 60 VUs
- **Mục tiêu:** Mô phỏng hành vi người dùng thực tế với think-time giữa các bước.
- **Thresholds:** `p(95) < 800ms` tổng, `p(95) < 500ms` per-step

### 🖥️ Các Chế độ Hiển thị (Display Modes)

Hệ thống cung cấp hai phương thức quan sát kết quả:
- **Terminal CLI:** Hiển thị raw data và text summary nhanh gọn ngay trong console k6.
- **Grafana Dashboard:** Tích hợp InfluxDB + Grafana qua Docker để trực quan hóa real-time bằng biểu đồ.

---

## 📊 5. EXPLAINING RESULTS – Giải thích kết quả (3 phút)

> [!NOTE]
> **Lời dẫn:** "Sau khi chạy xong, k6 sẽ trả về các con số. Đây là cách chúng ta đọc chúng."

| Chỉ số                  | Ý nghĩa quan trọng                              |
| :---------------------- | :---------------------------------------------- |
| **`http_req_duration`** | Thời gian phản hồi (Xem `p(95)` thay vì `avg`). |
| **`http_req_failed`**   | Tỷ lệ lỗi (Lý tưởng là 0%).                     |
| **`vus`**               | Số lượng người dùng ảo đồng thời đã chạy.       |
| **`http_reqs`**         | Tổng số request đã thực hiện được.              |

---

## 🎯 6. CONCLUSION – Kết luận (2 phút)

k6 là một công cụ **Nhẹ - Mạnh - Dễ dùng**, cực kỳ phù hợp cho môi trường phát triển hiện đại. Nó giúp chúng ta chuyển từ việc "đoán" sang "biết" chính xác năng lực hệ thống.

### 💡 Bài học rút ra:

- Phát hiện sớm điểm nghẽn trước khi Go-live.
- Đảm bảo trải nghiệm người dùng mượt mà dưới tải lớn.
- Tối ưu hóa tài nguyên phần cứng.

---

> [!IMPORTANT]
> **CÂU CHỐT CUỐI:**
> "Nếu không kiểm thử hiệu năng, hệ thống có thể chạy rất tốt với một người dùng, nhưng sẽ sụp đổ ngay khi đón nhận khách hàng thứ 100. Đừng để production là nơi đầu tiên bạn test giới hạn của mình."
