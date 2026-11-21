# Đảo Đèn Lồng (Lantern Island) — 3D AI SDLC Game

> **Học viên:** Hồ Anh Dũng · **MSSV:** 03613 · **Khóa 5 - L3A**  
> **Video Demo:** [docs/demo/demo.mp4](docs/demo/Demo.mp4)  
> **Lab Board:** [Đảo Đèn Lồng Lab](https://claude.ai/artifact/Q1RYyv1dxjUczzCbd2ZnoW)  
> **Phiên bản phát hành:** Release `v1.0.0` (Ticket-04 — "Bình minh: phát hành v1.0.0") · **Contract:** `v1.3` · **Tag:** `phase-4` / `v1.0.0`

---

## 1. Cài Đặt & Khởi Chạy Nhanh (Tối đa 2 lệnh)

Game chạy đa nền tảng (Windows, macOS, Linux) thông qua nền tảng Web 3D (Three.js WebGL) và runtime Node.js:

```bash
# 1. Cài đặt phụ thuộc
npm install

# 2. Khởi chạy máy chủ game
npm start
```
Mở trình duyệt bất kỳ tại: **http://localhost:3000**

---

## 2. Hướng Dẫn Điều Khiển & Tính Năng Trò Chơi (Release v1.0.0)

### Phím điều khiển mặc định (Có thể đổi tự do trong Cài Đặt):
- **Di chuyển:** Phím `W`, `A`, `S`, `D` (hoặc các phím mũi tên).
- **Xoay Camera 3D:** Giữ chuột trái và di chuột để xoay góc nhìn mượt mà.
- **Nhảy:** Phím `Space` (vận tốc Y 7.0 m/s, trọng lực -20 m/s², chỉ nhảy khi chạm đất).
- **Lướt (Dash):** Phím `Shift` hoặc `F`. Tốc độ 14 m/s trong 0.2s (12 ticks), hồi chiêu 1.5s (90 ticks).
- **Tương tác Đèn (E):**
  - **Thắp mới:** Cần 10 đom đóm, cộng **+100 điểm**, mở rộng túi chứa `+2`.
  - **Thắp lại:** Đèn đã cạn dầu dập tắt chỉ cần **5 đom đóm** để thắp lại, cộng **+40 điểm**, mở rộng túi `+2`.
  - **Châm dầu:** Đèn đang sáng tự tiêu hao 1.0 dầu/s. Bấm `E` để châm thêm dầu (+10 dầu/đom đóm), cộng **+5 điểm** mỗi đom đóm nạp.
- **Nhiên Liệu & Bóng Mực Hút Dầu:**
  - Khi đèn có `fuel < 30`, đèn mất vùng an toàn và bắt đầu nhấp nháy chậm (1 Hz).
  - Bóng Mực trạng thái lang thang (`wander`) sẽ tìm tới đèn yếu và chuyển sang hút dầu (`drain`, 5.0 dầu/s).
  - Khi châm dầu lên `>= 30`, vùng an toàn phục hồi và đẩy toàn bộ Bóng Mực ra mép 6m trong 30 tick.
- **Tỏa Sáng (Pulse):** Phím `Q` hoặc `Chuột Phải`. Tiêu tốn 3 đom đóm, bán kính 3D 5m. Làm choáng Bóng Mực trong 120 tick và đẩy lùi 4m. Nếu ngắt Bóng Mực đang hút dầu (`drain`), cộng thưởng lớn: **+15 điểm**.
- **Tạm dừng (Pause):** Phím `Esc` hoặc `P` để mở bảng Menu Tạm Dừng.

---

## 3. Tính Năng Mới Trong Phase 4 (Non-functional & Polish)

### 3.1. Dễ Tiếp Cận (Accessibility)
- **Đổi phím điều khiển (Key Remapping):** Hỗ trợ đổi tự do mọi phím hành động (Tiến, Lùi, Trái, Phải, Nhảy, Lướt, Tương tác, Tỏa Sáng, Tạm Dừng). Hệ thống tự động kiểm tra và cảnh báo khi người chơi chọn phím bị trùng lặp. Có nút "Khôi phục phím mặc định". Cấu hình được lưu tự động trên trình duyệt.
- **Phụ đề & Chỉ báo hình ảnh (Visual Alerts):**
  - Cảnh báo trực quan khi Bóng Mực xuất hiện kèm mũi tên chỉ hướng ở mép màn hình.
  - Cảnh báo gió mạnh sắp thổi trên Đảo Chuông.
  - Đếm ngược 10 giây cuối cùng trước bình minh.
  - Cảnh báo khi đèn lồng cạn dầu (`fuel < 30`).
- **Giảm chuyển động (Reduce Motion):** Tùy chọn trong Cài đặt để tắt rung lắc camera và các hiệu ứng chớp sáng.
- **Cỡ chữ UI linh hoạt (Large Font):** Kích thước chữ cơ bản tối thiểu 18px ở độ phân giải 1280×720, tích hợp tùy chọn cỡ chữ lớn (+25% / x1.25).
- **Chế độ mù màu (Colorblind Mode):** Đổi màu mắt kẻ địch sang `#00B3FF`, cảnh báo màu trắng với biểu tượng ⚠, đèn tắt làm dẹt 20%.

### 3.2. Bảng Xếp Hạng Cục Bộ (Local Leaderboard)
- Sau khi chiến thắng Đêm 3 (Bình Minh) hoặc sau khi thua ở bất kỳ Đêm nào, người chơi có thể nhập tên (3–12 ký tự `[A-Za-z0-9_]`) để lưu điểm.
- Hệ thống lưu trữ Top 10 kỷ lục cao nhất (sắp xếp điểm giảm dần; bằng điểm thì ai đạt trước đứng trên) kèm số Đêm thắng, hạt giống (seed) và mốc thời gian ISO 8601.
- Dữ liệu được lưu vĩnh viễn trên đĩa cục bộ (`data/leaderboard.json`) và `localStorage`.
- Xem bảng xếp hạng trực tiếp từ Menu chính hoặc Menu tạm dừng.
- Lệnh CLI xuất bảng xếp hạng ra file JSON:
  ```bash
  node src/headless.js --export-leaderboard out.json
  # hoặc
  npm start -- --export-leaderboard out.json
  ```

---

## 4. Kiểm Thử Hiệu Năng & Độ Bền (Benchmark & Soak Test)

### 4.1. Chế Độ Benchmark (Chấm Tự Động)
Lệnh chạy benchmark:
```bash
node src/benchmark.js --seed 42 --duration 30 --out bench.json
```
- **Cảnh đo chuẩn hóa:** Mở viewport 1280×720, Đêm 1 với 200 Bóng Mực lang thang và 100 đom đóm, 3 Đèn Lớn đang sáng (fuel 100).
- Camera quay đều quỹ đạo tròn bán kính 30m, cao 15m nhìn về tâm đảo (chu kỳ 15s/vòng).
- Khởi động 3 giây không đo, sau đó đo liên tục 30 giây.
- **Kết quả đo thực tế (`bench.json`):**
  - `avg_fps`: **85.5 FPS** (vượt xa ngưỡng yêu cầu `>= 60`)
  - `p1_low_fps`: **69.7 FPS** (vượt xa ngưỡng yêu cầu `>= 30`)
  - `frame_ms_p95`: **12.9 ms**
  - `load_ms`: **2400 ms** (ngưỡng `<= 10000 ms`)
  - `peak_mem_mb`: **46 MB**

### 4.2. Kiểm Thử Ngâm Tải Dài Hạn (Soak Test)
Lệnh chạy soak test:
```bash
node --expose-gc src/soak.js --seed 7 --nights 10 --out soak.json
```
- Chạy headless liên tục 10 Đêm trong cùng một tiến trình (chu kỳ Đêm 1 → 2 → 3), input ngẫu nhiên theo seed (đổi hướng mỗi 30 tick, xác suất jump/dash/pulse/interact).
- **Kết quả đo thực tế (`soak.json`):**
  - `nights`: 10 Đêm
  - `crashes`: **0**
  - `mem_start_mb`: **44 MB**
  - `mem_end_mb`: **42 MB** (tỷ lệ tăng trưởng `0% <= 20%`)
  - `duration_s`: **0.5 s**

---

## 5. Chạy Kiểm Thử Toàn Diện (79 Assertions)

```bash
npm test
```
Toàn bộ **79 bài test assertions** bao phủ:
1. Tất định PRNG 100% byte-for-byte (SHA256 trùng khớp hoàn toàn).
2. Vật lý di chuyển, nhảy, lướt 14 m/s, bục nhảy liên đảo, đẩy gió.
3. Cơ chế đom đóm, sức chứa động 10-20, bùa gió, kẻ địch Gió Lạc cướp đồ.
4. Cơ chế nhiên liệu đèn lồng, tiêu hao, châm dầu, thắp lại 5 đom đóm.
5. Bóng mực hút dầu (`drain`), tỏa sáng ngắt hút dầu (+15 điểm).
6. Luật thắng bình minh (`dawn_survived` khi lit >= 60%), không thắng sớm.
7. Thoát lỗi exit code 2 khi file scenario/inputs không hợp lệ.
8. Tiêu chuẩn Test Contract v1.3, Soak Test và Benchmark Mode.
9. Bảng xếp hạng và xuất dữ liệu CLI.

---

## 6. Cấu Trúc Mã Nguồn & Tài Liệu Nộp Bài

```text
├── game.contract.json          # Đặc tả chuẩn Test Contract v1.3
├── AGENTS.md                   # Harness chỉ dẫn cho Agentic AI
├── CHANGELOG.md                # Lịch sử thay đổi cả 4 Phase
├── CREDITS.md                  # Ghi nhận bản quyền công cụ AI & thư viện
├── LICENSE                     # Giấy phép nguồn mở MIT
├── bench.json                  # Kết quả đo Benchmark chuẩn hóa
├── soak.json                   # Kết quả đo Soak Test 10 Đêm
├── docs/
│   ├── RETROSPECTIVE.md        # Báo cáo hồi tưởng chi tiết 4 Phase
│   ├── notes/
│   │   ├── adr-phase-3-fuel-system.md  # Architectural Decision Record
│   │   └── phase-3-spec-assumptions.md # Đặc tả & giả định kỹ thuật
│   └── proof/
│       ├── phase-1-proof.md    # Bằng chứng kiểm thử Phase 1
│       ├── phase-2-proof.md    # Bằng chứng kiểm thử Phase 2
│       └── phase-3-proof.md    # Bằng chứng kiểm thử Phase 3
├── src/
│   ├── core/
│   │   ├── rng.js              # PRNG tất định LCG
│   │   ├── constants.js        # Hằng số chuẩn hóa & cấu hình bản đồ
│   │   ├── simulation.js       # Bộ mô phỏng 60 tick/s không phụ thuộc GPU
│   │   └── leaderboard.js      # Module quản lý bảng xếp hạng
│   ├── client/
│   │   ├── game.js             # Three.js 3D WebGL renderer, HUD & benchmark
│   │   └── audio.js            # Web Audio API tổng hợp âm thanh thủ tục
│   ├── headless.js             # CLI chạy headless xuất JSONL
│   ├── benchmark.js            # CLI chạy benchmark hiệu năng
│   ├── soak.js                 # CLI chạy soak test ngâm tải
│   └── server.js               # Máy chủ HTTP phục vụ game & API
└── tests/
    ├── run-all-tests.js        # Test runner toàn diện (79 assertions)
    └── scenarios/              # Kịch bản kiểm thử Contract v1.3
```
