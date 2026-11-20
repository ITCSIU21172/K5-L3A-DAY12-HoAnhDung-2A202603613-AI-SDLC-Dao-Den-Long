# Báo Cáo Hồi Tưởng Dự Án (Retrospective Report) — Đảo Đèn Lồng

- **Dự án**: Đảo Đèn Lồng (Lantern Island)
- **Học viên**: Hồ Anh Dũng (MSSV: 03613) — Khóa 5 L3A AI SDLC
- **Thời gian thực hiện**: 2026-11-20
- **Phiên bản hoàn tất**: Release v1.0.0 · Tag `phase-4` · Test Contract `v1.3`

---

## 1. Tổng Hợp Đánh Giá 4 Phase (Evaluation of 4 Phases)

| Phase | Mục tiêu & Phạm vi | Điểm đạt được | Đánh giá & Bài học |
| :--- | :--- | :--- | :--- |
| **Phase 1** (Ticket-01) | Xây dựng bộ mô phỏng core headless, PRNG tất định 100%, Three.js 3D WebGL, Web Audio thủ tục, Test Contract v1.0. | Pass 100% test v1.0, chạy mượt mà 60 tick/s, giao diện truyền thống Việt Nam (nón lá, đèn lồng). | Phân tách rạch ròi giữa logic thuần (`src/core/`) và giao diện hiển thị (`src/client/`) là nền tảng sống còn cho toàn bộ quy trình AI SDLC. |
| **Phase 2** (Ticket-02) | Chuẩn hóa thông số vật lý (vận tốc, gia tốc, bán kính), mở rộng 3 Đêm (Đảo Cau - 2 đảo nối cầu tre, Đảo Chuông - 3 tầng cao), thêm kỹ năng Lướt (Dash), Bục nhảy, Gió Lạc, Bùa Gió. | Chuẩn hóa toàn bộ số liệu, pass 39 assertions, duy trì tất định byte-for-byte SHA256. | Việc chuẩn hóa số liệu bằng bảng hợp đồng giúp AI không tự ý "sáng tác" số liệu tùy tiện, giữ trải nghiệm điều khiển đồng nhất. |
| **Phase 3** (Ticket-03) | Change Request "Đèn cạn dầu", tiêu hao 1.0/s, Bóng Mực hút 5.0/s khi fuel < 30, thắp lại 5 đom đóm, sức chứa động 10-20, luật thắng bình minh (dawn survival). | Pass 60 assertions, giải quyết triệt để vấn đề mất nhịp độ cuối game, thêm chế độ mù màu. | Xử lý Change Request đòi hỏi viết ADR (Architectural Decision Record) cẩn thận trước khi sửa mã nguồn để tránh phá vỡ các giả định cũ. |
| **Phase 4** (Ticket-04) | Đo lường hiệu năng (Benchmark 200 Shades + 100 motes), Soak Test 10 Đêm liên tiếp, Bảng xếp hạng cục bộ, Dễ tiếp cận (Key remap, Visual alerts, Motion/Font settings). | Pass 79 assertions, avg_fps = 85.5 (ngưỡng >= 60), mem_end <= 1.2 * mem_start, 0 crash. | Sản phẩm đạt trạng thái hoàn thiện phát hành (release-ready) với đầy đủ công cụ định lượng chất lượng sản phẩm. |

---

## 2. Điều Gì Hiệu Quả và Không Hiệu Quả Khi Làm Việc Với AI?

### Điều hiệu quả vượt trội:
1. **Thiết kế kiến trúc sạch dựa trên Test Contract**: Khi cung cấp schema JSON và bảng đặc tả số liệu chính xác, AI sinh mã nguồn logic mô phỏng cực kỳ chuẩn xác, không bị lẫn lộn giữa trạng thái tick và rendering frame.
2. **Tự động hóa kiểm thử hồi quy (Regression Testing)**: AI có khả năng viết hàng chục scenario test bao phủ các góc khuất (edge cases) như va chạm cùng tick, rơi khỏi đảo, cạn dầu đúng lúc bình minh, choáng khi đang hút dầu.
3. **Sinh nội dung thủ tục (Procedural Assets)**: Không cần tải các file 3D/Audio nặng hàng trăm MB từ bên ngoài, AI tự sinh toàn bộ âm thanh qua Web Audio API (dao động sóng, envelope, filter) và hình học Three.js (Cone, Cylinder, Dodecahedron) nhẹ nhàng và hoàn toàn miễn phí bản quyền.

### Điều chưa hiệu quả / Thử thách:
1. **Môi trường Sandbox và Quyền truy cập tệp trên Windows**: Lệnh Git commit/tag và mở socket mạng loopback trên Windows thường bị cơ chế sandbox của hệ thống chặn (`EPERM`, `index.lock`), đòi hỏi kỹ sư phải hiểu rõ để áp dụng `BypassSandbox: true` đúng chỗ cho các thao tác git/network.
2. **Cơ chế thu gom rác (V8 GC) của Node.js**: Trong bài kiểm thử Soak Test, bộ nhớ RSS của Node.js trên Windows tăng nhẹ do phân mảnh bộ nhớ của hệ điều hành chứ không phải rò rỉ bộ nhớ JS. AI cần phải phân tích sâu bản chất của V8 heap và kích hoạt `--expose-gc` để đưa ra số đo chuẩn xác.

---

## 3. Những Lần AI Sai và Cách Phát Hiện / Khắc Phục

1. **Lỗi thứ tự đọc input trong headless runner (Tick 0 vs Tick 1)**:
   - *Hiện tượng*: Khi chạy scenario refuel, bài test báo lỗi không nạp được dầu ở tick 1.
   - *Cách phát hiện*: Đọc log chi tiết của `run-all-tests.js` và kiểm tra mảng frames trong file input JSON.
   - *Nguyên nhân & Khắc phục*: Headless runner chạy vòng lặp từ tick 0, nhưng frame input lại gán `tick: 1` nên tương tác bị lùi lại 1 bước. Sửa lại frame input `tick: 0` để lệnh tương tác được kích hoạt ngay bước đầu tiên.
2. **Lỗi tích lũy số thực khi trừ dầu (Floating-point drift)**:
   - *Hiện tượng*: Khi trừ dầu `1/60` và `5/60` mỗi tick, nếu lưu trữ kiểu `float`, giá trị dầu bị số lẻ vô hạn tuần hoàn (e.g. `29.9999999994`), dẫn đến việc kiểm tra điều kiện `< 30` bị sai lệch giữa các nền tảng CPU khác nhau.
   - *Cách phát hiện*: Kiểm tra mã băm SHA256 của output headless giữa các lần chạy.
   - *Khắc phục*: Chuyển đổi toàn bộ lưu trữ nội bộ sang đơn vị nguyên `fuel_ticks` (6000 ticks = 100 đơn vị dầu), mỗi tick trừ chính xác `1` hoặc `5` tick nguyên, chỉ làm tròn khi xuất snapshot JSONL.

---

## 4. Đánh Giá Harness AI (AGENTS.md, Skills, Verification)

- **`AGENTS.md`**: Là harness có tác động lớn nhất! File này đóng vai trò như một "kim chỉ nam" bắt buộc AI phải luôn tuân thủ nguyên tắc phân tách core/client, quy trình 12 bước trong tick, mã thoát lỗi exit code 2 và không được sửa tay kết quả test.
- **Rule "Không giả mạo kết quả test"**: Ngăn chặn triệt để xu hướng của AI viết test giả tạo (`assert(true)`) khi gặp lỗi khó, buộc AI phải debug đến cùng nguyên nhân gốc rễ.
- **Verification Skill**: Cung cấp quy trình kiểm chứng kép (vừa kiểm tra bằng headless CLI, vừa kiểm tra qua 3D WebGL) giúp chất lượng sản phẩm đạt độ tin cậy tuyệt đối.

---

## 5. Ước Tính Token & Chi Phí AI và Chiến Lược Tiết Kiệm

- **Tổng số lượt tương tác**: ~4 phiên trao đổi chính tương ứng 4 Phase.
- **Tổng số token tiêu thụ (ước tính)**: ~380,000 input tokens, ~45,000 output tokens.
- **Chi phí ước tính**: ~$0.85 USD (dựa trên biểu giá Gemini / Claude API hiện hành).
- **Chiến lược tiết kiệm token đã áp dụng**:
  1. Chỉ đọc các đoạn code liên quan (`StartLine` - `EndLine`) thay vì đọc toàn bộ file mã nguồn lớn nhiều lần.
  2. Tạo các test scenario nhỏ gọn (10-30 dòng JSON) để tái hiện lỗi thay vì chạy mô phỏng hàng chục nghìn tick.
  3. Tận dụng subagent chuyên biệt (Browser Subagent) để kiểm tra các thông tin cập nhật trên web ngoài luồng mà không làm phình context chính.

---

## 6. Nếu Làm Lại Từ Đầu Thì Sẽ Thay Đổi Điều Gì?

1. **Chuẩn hóa hệ thống State Machine ngay từ Phase 1**: Ở Phase 1, các trạng thái của Shade chỉ có `chase` và `wander`. Khi sang Phase 3 thêm `drain`, một số đoạn mã phải refactor lại. Nếu ngay từ đầu thiết kế State Machine hoàn chỉnh (với bảng chuyển đổi trạng thái tường minh), việc mở rộng sẽ nhanh hơn nữa.
2. **Tích hợp sẵn bộ đo Benchmark ngay từ Phase 1**: Việc đo đạc FPS và memory nên được đưa vào harness kiểm thử tự động ngay từ ngày đầu thay vì đợi đến phase phát hành cuối cùng.
