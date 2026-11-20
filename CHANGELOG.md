# Changelog - Đảo Đèn Lồng (Lantern Island)

Tất cả các thay đổi quan trọng của dự án sẽ được ghi nhận tại file này. Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Phase 3] - 2026-11-20 (Contract v1.2) - Change Request "Đèn cạn dầu"

### Đã thêm (Added)
- **Nhiên liệu Đèn (Lantern Fuel)**:
  - Nhiên liệu tối đa `100.0`. Khi vừa thắp hoặc thắp lại, đèn có `fuel = 100.0`.
  - Tự tiêu hao tự nhiên `1.0` đơn vị/giây (1/60 mỗi tick).
  - Tương tác châm dầu tại đèn đang sáng: `used = min(carried, ceil((100 - fuel)/10))`. Cộng `10 * used` dầu và phát sự kiện `refuel`.
  - Khi `fuel <= 0`, đèn tắt, phát sự kiện `lantern_out` và nhớ `ever_lit = true`.
- **Cơ chế Thắp Lại (Relighting)**:
  - Đèn đã từng sáng (`ever_lit = true`) chỉ tốn 5 đom đóm để thắp lại (thay vì 10).
  - Phát sự kiện `lantern_lit` với `{ relight: true }`, cộng `+40` điểm.
- **Bóng Mực Hút Dầu (Shade Draining)**:
  - Đèn có `fuel < 30` bị mất vùng an toàn.
  - Bóng Mực trạng thái `wander` ưu tiên tìm tới đèn yếu gần nhất. Khi tới `<= 2.0m`, chuyển sang trạng thái `drain` và hút `5.0` dầu/giây.
  - Mỗi 60 ticks hút liên tục phát sự kiện `fuel_drain`.
  - Tỏa Sáng (Pulse) trúng Bóng Mực đang drain thưởng `+15` điểm (thay vì `+5`).
- **Sức Chứa Động (Dynamic Capacity)**:
  - Sức chứa đom đóm khởi điểm là 10, tăng `+2` sau mỗi lần thắp thành công (thắp mới hoặc thắp lại), tối đa 20.
  - Hiển thị đầy đủ số slot tương ứng trên HUD 3D.
- **Chế độ Mù Màu (Colorblind Mode)**:
  - Mắt Bóng Mực chuyển sang màu `#00B3FF`.
  - Cảnh báo màu trắng với biểu tượng ⚠.
  - Đèn chưa thắp được làm dẹt 20% chiều cao (`scale.y = 0.8`).
  - Hỗ trợ công tắc bật/tắt trong bảng Cài đặt (Settings).

### Đã thay đổi (Changed) - Breaking Changes vs Contract v1.1
- **Điều kiện Thắng Mới**:
  - Không còn thắng sớm khi thắp hết đèn.
  - Thắng lúc bình minh (`time_left_s <= 0`) với lý do `dawn_survived` khi số đèn sáng `>= ceil(0.6 * tổng số đèn)` (Đêm 1: 3/5, Đêm 2: 4/6, Đêm 3: 5/7).
- **Hệ thống Điểm Chuẩn hóa v1.2**:
  - Nạp đom đóm: `+5` điểm (thay vì +10 cũ).
  - Thắp đèn lần đầu: `+100` điểm.
  - Thắp lại đèn đã tắt: `+40` điểm.
  - Điểm thắng bình minh: `+50 + floor(fuel)` mỗi đèn đang sáng, cộng `+50` mỗi Ngọn Lửa còn lại. Bỏ điểm cộng theo thời gian thừa.
- **Thời gian Đêm Chuẩn hóa**:
  - Đêm 1: 240 giây (4 phút).
  - Đêm 2: 270 giây (4.5 phút).
  - Đêm 3: 300 giây (5 phút).

---

## [Phase 2] - 2026-11-20 (Contract v1.1) - "Ba hòn đảo"

### Đã thêm (Added)
- Hỗ trợ 3 Đêm hoàn chỉnh: Đảo Bến (Đêm 1), Đảo Cau (Đêm 2 - 2 đảo), Đảo Chuông (Đêm 3 - 3 tầng cao).
- Kỹ năng Lướt (Dash): 14 m/s trong 12 ticks, hồi chiêu 90 ticks (1.5s).
- Bục nhảy (Jump Pad): quỹ đạo đạn đạo đưa người chơi bay qua vực.
- Kẻ địch mới Gió Lạc (Drifter): bay trên cao, cướp đom đóm, rơi lại khi trúng Tỏa Sáng.
- Vật phẩm Bùa Gió (Wind Charm): xóa hồi chiêu lướt trong 600 ticks.
- Hệ thống Pause (Esc / P) và lưu cấu hình âm lượng / độ nhạy vào localStorage.

---

## [Phase 1] - 2026-11-20 (Contract v1.0) - "Ngọn lửa Đảo Bến"

### Đã thêm (Added)
- Bộ mô phỏng tất định thuần túy Node.js (`src/core/simulation.js`, `src/core/rng.js`).
- Giao diện 3D Three.js WebGL và tổng hợp âm thanh Web Audio API (`src/client/game.js`, `src/client/audio.js`).
- Chế độ headless CLI (`src/headless.js`) hỗ trợ xuất JSONL snapshot.
