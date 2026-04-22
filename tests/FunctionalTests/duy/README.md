# Thư Mục Test - Duy
**Nhiệm vụ (Assignment):** Vòng đời Nhiệm vụ (Missions), Timelines và Websockets Realtime (FR3 & FR6).

### Các File Test Đề Xuất
1. `missions.test.js`: Test tạo, start, abort mission và gán request.
2. `timelines.test.js`: Test quy trình accept -> arrive -> complete và kiểm tra đồng bộ request state.
3. `notifications.test.js`: Test sự kiện Websocket (MISSION_ASSIGNED, etc).

> *Lưu ý: Bạn Duy phụ trách luồng nghiệp vụ xương sống của hệ thống, nên nhớ import các hàm setup database để reset trạng thái FSM (Trạng thái hữu hạn) trước mỗi lần test.*
