# Kế Hoạch Kiểm Thử Tự Động (Automated Test Plan) - Flood Rescue System

> **Loại Kiểm Thử:** Automated Integration Testing (Kiểm thử tích hợp tự động).  
> **Công cụ (Tools):** `Jest`, `Supertest` (cho API REST), `socket.io-client` (để test WebSocket). API thăm dò ban đầu dùng Postman.  
> **Môi trường:** Localhost (Mũi nhắm vào test Database rieng biệt, ví dụ `flood_rescue_test`).  
> **Mục tiêu:** Verify logic nghiệp vụ Backend nhanh, mức độ phủ sóng rộng (High-level) cho tất cả các tính năng. Không gồm Non-Functional Tests (VD: Load testing, K6).

---

## 1. PHÂN CÔNG NHIỆM VỤ (WORK ALLOCATION)

Để tối ưu hóa sức mạnh của team 4 người, công việc sẽ được chia luồng như sau:

| Thành Viên | Phụ Trách (Feature Scope) | Độ Phức Tạp | Lý Do Phân Công |
| :--- | :--- | :---: | :--- |
| **Member 1 (Lead)**<br>*(Nắm vững nghiệp vụ)* | **FR3:** Vòng đời Nhiệm vụ (Mission & Timeline)<br>**FR6:** Realtime Notification & Websockets | 🔥 Cấp S | Luồng này là "trái tim" của hệ thống. Chứa logic FSM (State Machine) cực kỳ phức tạp để đồng bộ từ Update Timeline -> Sync Mission -> Sync Request. Kèm theo WebSockets thay đổi Realtime. Đòi hỏi người nắm rõ architecture nhất để setup giả lập. |
| **Member 2** | **FR2:** Quản lý Yêu cầu (Request Module) | ⭐️ Cấp A | Phức tạp trong xử lý Index phân bổ theo địa lý (2dSphere GeoJSON), tính toán thuật toán sắp xếp độ ưu tiên (Priority algorithm) và xử lý cấm trùng lặp (Duplicate Detection). |
| **Member 3** | **FR1:** Quản lý User Auth & Vai trò (RBAC)<br>**FR4:** Đội cứu hộ & Đơn ứng tuyển | ⭐️ Cấp A | Tập trung test quyền truy cập (Guards/Roles) cực kì nghiêm ngặt đối với token JWT (Citizen, Coordinator, Admin). Kéo theo luồng phê duyệt Đơn ứng tuyển để thăng cấp tự động vai trò User. |
| **Member 4** | **FR5:** Hậu cần - Vật tư, Kho hàng, Phương tiện | 🟢 Cấp B | Độc lập về mặt dữ liệu, chủ yếu Test các nghiệp vụ Logic Thêm/Sửa/Xóa (CRUD) cơ bản, Logic nhắc bảo trì dựa trên biến thời gian, và xử lý phân tích logic dữ liệu tải lên từ file Excel (multer). |

---

## 2. KỊCH BẢN KIỂM THỬ KHÁI QUÁT (HIGH-LEVEL TEST SCENARIOS)

Dưới đây là các User Scenarios cơ bản cần được tự động hóa bằng Jest cho mỗi thành viên:

### 🧑‍💻 **Member 1 (Missions, Timelines & Websockets)**
> **Mục tiêu:** Đảm bảo toàn vẹn dữ liệu trong tiến trình xử lý Nhiệm vụ và truyền phát thời gian thực.
- `[Mission]` Test Coordinator tạo DRAFT Mission hợp lệ và kiểm tra Catch Validation nếu thiếu field bắt buộc.
- `[Mission]` Test gán Request và Team vào Mission: Verify hệ thống tự sinh mã Timeline (`PLANNED`) cho mỗi Đội tham gia.
- `[State Sync]` Test Lifecycle chuyển trạng thái `START` Mission: Verify Timeline tự chuyển sang `ASSIGNED`.
- `[State Sync]` Trình tự Test luồng chuẩn đội cứu hộ ngoài thực địa (Timeline Update): `Accept` -> `Arrive` -> `Complete`.
  - *Verify quan trọng:* Xâu chuỗi xem Request gốc có tự động chuyển trạng thái logic `IN_PROGRESS` thành `FULFILLED/CLOSED` hay không sau timeline result.
- `[WebSocket]` Dùng client giả lập gửi yêu cầu Connect bằng JWT Auth -> Thực hiện Start một Mission và bắt tín hiệu sự kiện `MISSION_ASSIGNED` trên instance socket phía client -> Verify payload Socket.

### 🧑‍💻 **Member 2 (Requests Management Module)**
> **Mục tiêu:** Đảm bảo Citizen và Coordinator tương tác với Request chính xác, logic Priority tính đúng.
- `[Create Request]` Test tạo Request thành công từ phía Citizen -> Test chặn Spam tạo Request thứ 2 khi Request đầu vẫn đang `SUBMITTED`.
- `[On-behalf]` Test Coordinator tạo Request On-behalf: Verify Status tự động chuyển thẳng sang `VERIFIED`.
- `[Filtering/Sort]` Khởi tạo 5 Request với độ khẩn cấp (Priority) và Số người nạn nhân tính toán khác nhau. Run tính năng Pagination & Querry Request All -> Test Verify danh sách trả về xếp hạng đúng thứ tự ưu tiên.
- `[Cancel]` Test tính năng huỷ (Citizen tự hủy). Test Guard chặn huỷ nếu yêu cầu đã bị kéo sang tiến độ cao hơn (`VERIFIED` trở lên).
- `[Duplicate]` Test tính năng Mark Duplicate của Coordinator. Verify request bị đánh dấu trùng có sync Priority lại y hệt với Request gốc hay không.

### 🧑‍💻 **Member 3 (Users, Roles & Team Management)**
> **Mục tiêu:** Authentication Flow và quy trình thành lập, cấp phép cấu trúc Đội hình (RBAC).
- `[Auth]` Cấp phép JWT: Login với đúng tài khoản, test mã trả về Token. Test truy cập 1 API cấm bằng Token hết hạn hoặc sai Role (chặn 403 Forbidden).
- `[Users]` Test truy vấn danh sách Users của Admin so với Coordinator (Admin thấy toàn bộ, Coordinator bị data scope giới hạn không truy vấn được Admin/Manager).
- `[Team App]` Test nộp form ứng tuyển Citizen -> Gọi API Rút lại đơn (Withdraw) -> Gọi API tạo lại đơn.
- `[Team App - Promotion]` Test luồng thay mặt Admin gọi hàm `PATCH .../approve` -> Fetch lại DB Verify Citizen Role đã chuyển thành `Rescue Team`.
- `[Team Mgmt]` Test cản trở (Guard): Update Team để xóa Đội trưởng khi team đang ở trạng thái `BUSY` -> Expect ném lỗi báo chặn hệ thống (400 Bad Request).

### 🧑‍💻 **Member 4 (Warehouse, Supply & Vehicles)**
> **Mục tiêu:** Chức năng Module Nội Bộ để quản lý Hậu cần thông thuộc luồng CRUD.
- `[Catalog]` Test Tạo, Đọc, Cập nhật, Xóa (CRUD) một loại Item (Vật tư) -> Chắn quyền phân quyền: Dùng Token Citizen gọi API xóa Vật tư -> Expect ném 403 Forbidden.
- `[Inventory/Warehouse]` Test việc tạo kho theo tọa độ GPS. Gán dữ liệu vật tư vào kho và thử Update biến count (Restock qty).
- `[Vehicles]` Nhập xe (Create Vehicle) -> Gán xe (Assign Vehicle) để tham gia Đội bằng ID Đội hình -> Verify Response trả về Success.
- `[Vehicles - Maintenance]` Giả lập sửa `lastMaintenanceDate` của vehicle trong test DB lui về quá khứ 31 ngày -> Chạy GET kiểm tra bảo dưỡng -> Chắc chắn xe hiển thị trong danh sách cần sửa `needed`.

---

## 3. CÁC QUY CHUẨN KHI VIẾT TEST (JEST CONVENTIONS)
1. **Reset Database:** Mỗi test suite (`describe`) cần sử dụng phương thức `beforeAll` hoặc `beforeEach` để xoá rác Database (`Collection.deleteMany({})`) trước khi chạy, tránh conflict IDs.
2. **Setup Mocks Authentication:** Sử dụng cấu hình hàm `generateTestToken(role)` chạy trước setup để lấy Bearer token bỏ vào Header (`.set('Authorization', 'Bearer token')`) trên Supertest thay vì phải hit API đăng nhập làm rác file test.
3. **HTTP Status Code Assertion:** Khẳng định bằng lệnh `expect(res.status).toBe(...)`. (VD: Success 200/201, Validations Error 400, Not Authorized 401/403).
