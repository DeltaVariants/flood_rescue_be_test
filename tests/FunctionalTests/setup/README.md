# Setup Utilities
Thư mục này chứa các tiện ích dùng chung cho toàn bộ các file test để tránh việc lặp lại code (DRY).

Các tiện ích dự kiến:
- `db.setup.js`: Chứa hàm `beforeAll`, `afterAll` kết nối và xoá trắng database test.
- `auth.mock.js`: Hàm tạo JWT Token giả lập cho Citizen, Admin, Coordinator...
- `socket.mock.js`: Cấu hình `socket.io-client` cho Websocket.
