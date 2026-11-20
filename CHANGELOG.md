# Changelog - Đảo Đèn Lồng (Lantern Island)

Tất cả các thay đổi quan trọng của dự án sẽ được ghi nhận tại file này. Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Phase 4] - 2026-11-20 (Contract v1.3) - Release v1.0.0 "Bình minh: phát hành v1.0.0"

### Đã thêm (Added)
- **Chế Độ Đo Hiệu Năng (Benchmark Mode)**:
  - Lệnh: `node src/benchmark.js --seed 42 --duration 30 --out bench.json`
  - Cảnh benchmark chuẩn hóa: 1280x720, Đêm 1 với 200 Bóng Mực lang thang và 100 đom đóm, 3 Đèn Lớn đang sáng (fuel 100).
  - Tắt sát thương, nhặt đồ, dập tắt và điều kiện kết thúc; camera bay quỹ đạo tròn bán kính 30m, cao 15m nhìn vào tâm đảo (chu kỳ 15s/vòng).
  - Đo 30s sau 3s khởi động, tính toán đầy đủ `avg_fps` (85.5 FPS), `p1_low_fps` (69.7 FPS), `frame_ms_p95` (12.9 ms), `load_ms` (2400 ms).
- **Kiểm Thử Ngâm Tải Dài Hạn (Soak Test)**:
  - Lệnh: `node --expose-gc src/soak.js --seed 7 --nights 10 --out soak.json`
  - Chạy headless 10 Đêm liên tiếp trong cùng một tiến trình, input ngẫu nhiên theo seed; xác nhận 0 crash và độ tăng trưởng bộ nhớ RSS `< 20%` (`mem_start_mb = 44`, `mem_end_mb = 42`).
- **Bảng Xếp Hạng Cục Bộ (Local Leaderboard)**:
  - Hỗ trợ nhập tên (3-12 ký tự `[A-Za-z0-9_]`) sau khi thắng Đêm 3 hoặc sau khi thua ở bất kỳ Đêm nào.
  - Lưu trữ top 10 điểm cao nhất kèm ngày giờ ISO 8601, số Đêm vượt qua và seed bản đồ trên đĩa cục bộ (`data/leaderboard.json`) và `localStorage`.
  - Hỗ trợ xuất bảng xếp hạng qua CLI: `npm start -- --export-leaderboard out.json` hoặc `node src/headless.js --export-leaderboard out.json`.
- **Tính Năng Dễ Tiếp Cận (Accessibility)**:
  - Đổi phím điều khiển (Key Remapping): Di chuyển 4 hướng, Nhảy, Lướt, Tương tác, Tỏa Sáng, Tạm dừng; tự động phát hiện và cảnh báo trùng phím; nút "Khôi phục phím mặc định".
  - Phụ đề & chỉ báo hình ảnh trực quan: Cảnh báo Bóng Mực xuất hiện (kèm mũi tên chỉ hướng ở mép màn hình), cảnh báo gió mạnh sắp thổi, đếm ngược 10s cuối, cảnh báo đèn sắp cạn dầu (<30).
  - Giảm chuyển động (Reduce Motion): Tùy chọn tắt rung lắc camera và hiệu ứng chớp sáng màn hình.
  - Cỡ chữ UI lớn (+25% Font Size): Đảm bảo kích thước tối thiểu >= 18px ở 1280x720 và tùy chọn phóng to x1.25.
- **Tài Liệu Tổng Kết & Video**:
  - `docs/RETROSPECTIVE.md`: Bản hồi tưởng chi tiết toàn bộ 4 phase của quy trình AI SDLC.
  - `CREDITS.md`: Liệt kê đầy đủ công cụ AI, thư viện Three.js, thủ tục âm thanh Web Audio và hình học 3D.
  - `bench.json` và `soak.json` được đính kèm và kiểm chứng tự động qua bộ test 79 assertions.

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
