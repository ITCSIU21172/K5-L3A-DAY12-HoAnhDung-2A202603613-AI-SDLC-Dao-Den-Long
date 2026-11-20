# ADR-002: Dynamic Lantern Fuel Decay, Shade Draining, & Dawn Survival (Contract v1.2)

- **Trạng thái**: Accepted (Đã nghiệm thu)
- **Ngày**: 2026-11-20
- **Tác giả**: Agentic AI (Antigravity) & Ho Anh Dung (03613)
- **Ticket liên quan**: TICKET-03 — CHANGE REQUEST "Đèn cạn dầu" (Phase 3)
- **Contract Version**: v1.2

---

## 1. Bối cảnh (Context)
Trong Phase 1 và Phase 2 (Contract v1.0 & v1.1), người chơi kết thúc Đêm ngay khi thắp đủ 100% số đèn lồng. Qua quá trình playtest từ nhà sản xuất và người chơi, một vấn đề thiết kế phát sinh: người chơi có kỹ năng cao có thể thắp hết đèn trong vòng 2 phút đầu tiên, khiến nửa sau của mỗi Đêm bị bỏ trống và thiếu đi tính kịch tính, căng thẳng khi bình minh tới gần.

Nhà thiết kế game đã phát hành Change Request TICKET-03 nhằm:
1. Chuyển đổi mục tiêu từ **"Thắp hết đèn là thắng"** sang **"Giữ đảo sáng tới bình minh"**.
2. Đèn đã sáng sẽ hao hụt nhiên liệu theo thời gian (1.0 đơn vị/giây) và có thể bị tắt nếu không được châm thêm dầu.
3. Kẻ địch (Bóng Mực) có hành vi mới: tìm tới đèn yếu (< 30 dầu) để hút dầu (5.0 đơn vị/giây).
4. Người chơi có thể châm dầu cho đèn sáng hoặc thắp lại đèn đã tắt (chi phí giảm còn 5 đom đóm).
5. Sức chứa đom đóm tăng dần (+2 đom đóm mỗi lần thắp thành công, tối đa 20).
6. Bổ sung chế độ mù màu (Colorblind mode) phục vụ tiếp cận người dùng.

---

## 2. Quyết định Kiến trúc & Thiết kế (Decisions)

### D1. Biểu diễn Nhiên liệu Dầu bằng Đơn vị Số nguyên Ticks (Integer Fuel Ticks)
- **Vấn đề**: Việc trừ dầu liên tục ở tốc độ `1/60` và `5/60` mỗi tick nếu dùng số thực (`float`) có nguy cơ tích lũy sai số dấu phẩy động (IEEE 754), gây lệch determinism khi chạy cross-platform hoặc kiểm tra hash SHA256.
- **Quyết định**: Lưu trữ nội bộ dạng `fuel_ticks` nguyên (`100.0` fuel = `6000` ticks). Mỗi tick trừ chính xác `1` tick (do tự tiêu hao) và `5` ticks (mỗi Bóng Mực đang hút). Khi xuất snapshot ra JSON/JSONL, giá trị được chia cho 60 và làm tròn 1 chữ số thập phân (`round1(fuel_ticks / 60)`).

### D2. Quy trình Xử lý Tick Chuẩn hóa 12 Bước (Contract v1.2)
Tuân thủ nghiêm ngặt thứ tự 12 bước trong `src/core/simulation.js`:
1. **Input & Pause**: Đọc phím điều khiển, lướt, nhảy, tỏa sáng, tương tác, tạm dừng.
2. **Counters & Fuel Reduction**: Trừ thời gian Đêm, hồi chiêu, TTL đom đóm rơi. Giảm dầu tự nhiên (`-1`) và do Bóng Mực hút (`-5`). Đèn có `fuel <= 0` chuyển sang tắt, phát sự kiện `lantern_out`, ghi nhớ `ever_lit = true`.
3. **Move Mây**: Gia tốc, nhảy, lướt (14 m/s), bục nhảy liên đảo, đẩy gió, rơi vực.
4. **Pick**: Nhặt đom đóm (theo sức chứa động `10 + 2 * successful_lights`), nhặt Bùa Gió.
5. **Interact (Thắp / Thắp lại / Châm dầu)**:
   - Đèn chưa từng sáng: cần 10 đom đóm, phát `lantern_lit` (`relight: false`), điểm +100.
   - Đèn đã từng sáng (`ever_lit`): chỉ cần 5 đom đóm, phát `lantern_lit` (`relight: true`), điểm +40.
   - Đèn đang sáng (`fuel < 100`): nạp đom đóm châm dầu, phát `refuel`, điểm +5/đom đóm. Phục hồi vùng an toàn nếu dầu đạt `>= 30`.
6. **Safe Zones**: Đẩy bóng mực ra mép 6m trong tối đa 30 tick khi đèn vừa sáng hoặc được nạp `>= 30` dầu.
7. **Pulse (Tỏa Sáng)**: Bán kính 5m, choáng 120 tick, đẩy lùi 4m. Nếu đánh trúng Bóng Mực đang ở trạng thái `drain`, cộng thưởng `+15` điểm (thay vì `+5`).
8. **Move Enemies (Bóng Mực & Gió Lạc)**:
   - Bóng Mực `wander` ưu tiên tìm đèn sáng gần nhất có `fuel < 30`. Khi tới cách `<= 2m`, chuyển sang trạng thái `drain` đứng yên hút dầu.
   - Khi Mây tới gần `<= 6m`, Bóng Mực lập tức đổi từ `drain` sang `chase`.
9. **Contacts (Damage & Recoil)**: Bóng Mực gây `-1 Ngọn Lửa`, rơi 50% đom đóm, bất tử 90 tick.
10. **Spawn**: Sinh đom đóm định kỳ (mỗi 240 ticks nếu < 30), sinh Bóng Mực theo lịch từng Đêm.
11. **Win/Loss Check**:
    - Thua `no_flames`: Ngay lập tức khi Mây hết Ngọn Lửa.
    - Hết giờ (`time_left_s <= 0`):
      - Thắng `dawn_survived`: Nếu số đèn đang sáng `>= ceil(0.6 * tổng số đèn)`.
      - Thua `dawn`: Nếu số đèn sáng `< ceil(0.6 * tổng số đèn)`.
12. **Snapshot**: Xuất snapshot JSONL đầy đủ thông số Contract v1.2.

---

## 3. Hệ quả & Đánh giá (Consequences)
- **Tích cực**:
  - Nhịp độ gameplay tăng cao rõ rệt ở giai đoạn cuối Đêm: người chơi không thể "ngồi chờ" sau khi thắp hết đèn mà phải liên tục tuần tra, bảo vệ và châm thêm dầu.
  - Sức chứa tăng dần (10 -> 20) tạo cảm giác tiến trình nhân vật rõ rệt (progression).
  - Khả năng kiểm thử headless và determinism được bảo toàn 100% (SHA256 trùng khớp hoàn toàn, pass 60/60 bài test).
- **Cân nhắc**:
  - Người chơi phải phân phối đom đóm hợp lý giữa việc thắp đèn mới, giữ dầu cho đèn cũ và giữ 3 đom đóm để sẵn sàng dùng Tỏa Sáng (Q).
