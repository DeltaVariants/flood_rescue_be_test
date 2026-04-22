# Thư Mục Test - Bắc
**Nhiệm vụ (Assignment):** Authentication, Role, Users & Team Applications (FR1 & FR4).

### Các File Test Đề Xuất
1. `auth_users.test.js`: Đăng nhập, phân quyền, rào chắn middleware, Data scope truy vấn.
2. `team_apps.test.js`: Nộp đơn ứng tuyển, rút đơn, chấp thuận tự động biến User thành `Rescue Team`.
3. `team_mgmt.test.js`: Quản lý cấu trúc Đội, ngăn xoá leader nếu đang BUSY.

> *Lưu ý: Bắc cần nắm rõ các Guard Middleware như `authorize(["Admin", "Coordinator"])`, cần viết hàm mồi Bearer Token ở `setup/auth.mock.js` để test Role cho thuận tiện.*
