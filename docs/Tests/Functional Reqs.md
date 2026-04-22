# Phân tích Yêu cầu Chức năng (Functional Requirements) - Dự án Flood Rescue System

Tài liệu này hệ thống lại toàn bộ các chức năng cốt lõi đã và đang được triển khai thực tế trên kiến trúc codebase của dự án (dựa trên các Modules của Backend).

## 1. Quản lý Tài khoản & Phân quyền (Auth & Users)

- **FR1.01 - Đăng ký & Đăng nhập (Authentication):** Người dùng (Citizen) có thể đăng ký tài khoản (bắt buộc yêu cầu số điện thoại). Các Role khác có thể đăng nhập bằng tài khoản được cấp. Sử dụng JWT Access Token và Refresh Token (Session).
- **FR1.02 - Quản lý hồ sơ (Me):** Lấy thông tin session hiện tại của người dùng kèm phân quyền.
- **FR1.03 - Quản lý Thành viên (Admin/Coordinator):** Xem danh sách người dùng toàn hệ thống (có Data Scope theo quyền), tìm kiếm theo SĐT/Tên. Admin có thể thay đổi phân quyền (Update Role) của một người sang (Citizen, Rescue Team, Rescue Coordinator, Manager hoặc Admin).

## 2. Quản lý Yêu cầu Cứu hộ / Cứu trợ (Request Module)

- **FR2.01 - Tạo Yêu cầu (Citizen):** Người dân tạo yêu cầu với thông tin địa lý GeoJSON, loại sự cố, số người gặp hiểm nguy (giới hạn 1 request đang xử lý (active) cho mỗi Citizen).
- **FR2.02 - Tạo Yêu cầu Thay thế (On-behalf):** Coordinator có thể tạo yêu cầu cứu hộ/cứu trợ thay cho nạn nhân thông qua hotline hoặc hiện trường. Cấu hình tự động gán trạng thái `VERIFIED`.
- **FR2.03 - Tự động Sắp xếp (Auto-prioritization):** Trả về danh sách Requests được tự động ưu tiên dựa trên Thuật toán: Mức độ ưu tiên (Priority) > Số lượng nạn nhân > Thời gian khởi tạo.
- **FR2.04 - Cập nhật Trạng thái (Verify/Close):** Coordinator duyệt (Verify), Từ chối (Reject), hoặc Đóng (Close) các yêu cầu sau khi xử lý xong.
- **FR2.05 - Hủy Yêu cầu (Cancel):** Citizen (hoặc Coordinator) chỉ có quyền tự hủy yêu cầu nến status đang là `SUBMITTED`.
- **FR2.06 - Xử lý Trùng lặp (Duplicate Handling):** Coordinator có khả năng đánh dấu request bị trùng lặp, request này sẽ được đồng bộ mức độ ưu tiên theo request gốc.
- **FR2.07 - Điều chỉnh (Correction):** Cập nhật/Xác thực lại vị trí (Location verified) cũng như điều chỉnh Mức độ ưu tiên trực tiếp (Priority).

## 3. Vòng đời Nhiệm vụ & Vận hành (Mission & Timeline Modules)

- **FR3.01 - Lên kế hoạch (Mission Draft):** Coordinator khởi tạo trước một Chiến dịch/Nhiệm vụ (DRAFT).
- **FR3.02 - Nhúng Yêu Cầu (Mission Requests):** Đưa một hay nhiều Requests đang kẹt vào chung một Mission để xử lý đồng bộ.
- **FR3.03 - Phân bổ Đội (Assign Teams):** Gắn các Đội Cứu hộ tham gia Nhiệm vụ. Hệ thống rẽ nhánh sinh ra các `Timeline` độc lập mang trạng thái `PLANNED` cho từng Đội.
- **FR3.04 - Điều phối (Control Mission):** Coordinator Bắt đầu (Start), Tạm dừng (Pause), Tiếp tục (Resume) hoặc Hủy bỏ (Abort) toàn bộ Nhiệm vụ.
- **FR3.05 - Thực thi Timeline (Rescue Team):** Cập nhật vòng đời hành động của Team ngoài thực địa qua các bước: `Accept` (nhận tin) -> `Arrive` (đến nơi) -> `Complete` (hoàn tất) / `Fail` (thất bại) / `Withdraw` (rút lui).
- **FR3.06 - Đồng bộ Hậu xử lý (State Sync):** Hệ thống tự động thay đổi trạng thái của `Request` gốc (Tiến độ hoàn thành một phần hay toàn phần) dựa trên kết quả của các Timelines liên quan.

## 4. Quản lý Đội Cứu Hộ & Nguồn nhân lực (Teams & Applications)

- **FR4.01 - Ứng tuyển Tham gia (Team Applications):** Citizen đã kích hoạt (Active) được quyền nộp Hồ sơ gia nhập Lực lượng Cứu hộ (1 đơn Pending). Có thể Rút đơn khi chưa xử lý.
- **FR4.02 - Duyệt Hồ sơ (Approve/Reject):** Coordinator/Admin duyệt đơn Ứng tuyển. Khi chấp thuận, hệ thống tự động thăng cấp hệ thống của User sang quy chế `Rescue Team`.
- **FR4.03 - Quản lý Cấu trúc Đội (Team Management):** Khởi tạo tổ đội (Team), Chuyển giao Đội trưởng (Leader), Thêm/Bớt Thành viên.
- **FR4.04 - Đồng bộ Hiện diện (Status Availablity):** Team chuyển tự động giữa trạng thái `AVAILABLE` và `BUSY` theo tiến độ các Timeline mà Đội đang tham gia. Ngăn chặn thao tác thay Leader / Xóa Team nếu đội đang BUSY.

## 5. Quản lý Kho Bãi, Nhu Yếu Phẩm & Phương Tiện (Warehouse, Supply & Vehicles Module)

_Module dành riêng cho Manager điều phối Hậu cần._

- **FR5.01 - Danh mục Nhu yếu phẩm (Supply Catalog):** Thao tác CRUD danh mục các trang thiết bị và vật tư, có hỗ trợ tính năng Import từ file Excel.
- **FR5.02 - Cấu trúc Kho (Warehouse):** Định nghĩa vị trí (Location - GeoJSON) và Trạng thái của Kho hàng (FULL/EMPTY/MAINTENANCE).
- **FR5.03 - Quản lý Tồn Kho (Inventory):** Giám sát chi tiết số lượng hàng hóa trong từng Kho phân bổ.
- **FR5.04 - Gói Cứu Trợ (Combo Supplies):** Quản lý định mức các Combo thiết lập sẵn dành cho công tác Relief (Cứu trợ).
- **FR5.05 - Quản lý Phương Tiện (Vehicles Tracking):** Quản lý xe cứu thương/thuyền (Ambulance, Rescue Boat). Thống kê tình trạng hoạt động.
- **FR5.06 - Gán Phương tiện (Vehicle Assignment & Maintenance):** Gán phương tiện sử dụng cho một Đoị. Quản lý Tự động nhắc nhở quy trình bảo trì (Bảo dưỡng) sau khi hoạt động 30 ngày.

## 6. Lõi Hệ Thống Realtime (Websockets & Notification Modules)

- **FR6.01 - Trung tâm Thông báo (REST Notification):** Lấy danh sách Notify cá nhân, tổng đếm số lượng chưa đọc (Unread Count). Đánh dấu đã đọc.
- **FR6.02 - Websockets Events:** Emit các luồng dữ liệu thời gian thực tới App/Dashboard của từng Role cụ thể (Ví dụ: Request Submitted -> Báo cho Coordinator, Mission Assigned -> Báo cho Team/Citizen, Mission Approaching -> Báo cho Nạn nhân).
