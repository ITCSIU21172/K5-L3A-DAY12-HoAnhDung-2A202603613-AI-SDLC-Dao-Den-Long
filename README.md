# Đảo Đèn Lồng (Lantern Island) — 3D AI SDLC Game

> **Học viên:** Hồ Anh Dũng · **MSSV:** 03613 · **Khóa 5 - L3A**  
> **Video Demo:** [docs/demo/demo.mp4](docs/demo/demo.mp4)  
> **Lab Board:** [Đảo Đèn Lồng Lab](https://claude.ai/artifact/Q1RYyv1dxjUczzCbd2ZnoW)  
> **Phiên bản hiện tại:** Phase 3 (Ticket-03 Change Request — "Đèn cạn dầu") · **Contract:** `v1.2` · **Tag:** `phase-3`

---

## 1. Cài đặt & Khởi chạy (Tối đa 2 lệnh)

Game chạy đa nền tảng (Windows, macOS, Linux) qua nền tảng Web 3D (Three.js) và Node.js:

```bash
# 1. Cài đặt phụ thuộc
npm install

# 2. Khởi chạy game
npm start
```
Mở trình duyệt tại: **http://localhost:3000**

---

## 2. Hướng dẫn Điều khiển & Cơ chế Lối chơi (Phase 3 - Contract v1.2)

- **Di chuyển:** Phím `W`, `A`, `S`, `D` hoặc các phím mũi tên.
- **Xoay Camera 3D:** Giữ chuột trái và di chuột để xoay góc nhìn.
- **Nhảy:** Phím `Space` (vận tốc Y 7.0 m/s, trọng lực -20 m/s², chỉ nhảy khi chạm đất).
- **Lướt (Dash):** Phím `Shift` hoặc `F`. Lướt 14 m/s trong 0.2s (12 ticks), hồi chiêu 1.5s (90 ticks).
- **Tương tác Đèn (E):**
  - **Thắp lần đầu:** Cần 10 đom đóm, tạo vùng an toàn 6m, cộng **+100 điểm**, tăng sức chứa túi `+2`.
  - **Thắp lại:** Đèn đã tắt chỉ cần **5 đom đóm** để thắp lại, cộng **+40 điểm**, tăng sức chứa túi `+2`.
  - **Châm dầu:** Đèn đang sáng tự tiêu hao 1.0 dầu/giây. Bấm `E` để châm thêm dầu (+10 dầu/đom đóm), cộng **+5 điểm** mỗi đom đóm nạp.
- **Nhiên liệu & Bóng Mực Hút Dầu (Mới):**
  - Khi đèn có `fuel < 30`, đèn mất vùng an toàn và bắt đầu nhấp nháy 1 Hz.
  - Bóng Mực trạng thái lang thang (`wander`) sẽ tìm tới đèn yếu và chuyển sang trạng thái `drain` (hút 5.0 dầu/giây).
  - Khi châm dầu lên `>= 30`, vùng an toàn được phục hồi và đẩy toàn bộ bóng mực ra mép 6m trong 30 tick.
- **Tỏa Sáng (Pulse):** Phím `Q` hoặc `Chuột Phải`. Tiêu tốn 3 đom đóm, bán kính 3D 5m. Làm choáng Bóng Mực trong 120 tick và đẩy lùi 4m. Nếu ngắt Bóng Mực đang hút dầu (`drain`), cộng thưởng **+15 điểm** (thay vì +5).
- **Sức chứa túi đom đóm tăng dần (Dynamic Capacity):** Khởi điểm 10, tăng +2 mỗi lần thắp thành công (tối đa 20 đom đóm).
- **Chế độ Mù Màu (Colorblind Mode):** Bật/tắt trong Cài đặt (Esc/P). Mắt Bóng Mực chuyển màu `#00B3FF`, cảnh báo màu trắng với ⚠, đèn tắt dẹt 20%.

---

## 3. Điều Kiện Thắng / Thua Mới (Contract v1.2)

- **Không còn thắng sớm:** Thắp đủ đèn không kết thúc Đêm, người chơi phải giữ đảo sáng tới bình minh!
- **Thắng (`dawn_survived`):** Sống sót khi hết giờ (`time_left_s <= 0`) và số đèn đang sáng đạt tỷ lệ `>= 60%` tổng số đèn:
  - **Đêm 1 (Đảo Bến):** Cần tối thiểu **3 / 5** đèn sáng (thời lượng 240s).
  - **Đêm 2 (Đảo Cau):** Cần tối thiểu **4 / 6** đèn sáng (thời lượng 270s).
  - **Đêm 3 (Đảo Chuông):** Cần tối thiểu **5 / 7** đèn sáng (thời lượng 300s).
- **Thua:**
  - Hết Ngọn Lửa (`flames <= 0`) ngay lập tức (`reason: "no_flames"`).
  - Hết giờ mà số đèn sáng dưới ngưỡng quy định (`reason: "dawn"`).
- **Điểm thắng Bình Minh:**
  - `+50 + floor(fuel)` cho mỗi đèn đang sáng tại tick cuối.
  - `+50` cho mỗi Ngọn Lửa còn lại.

---

## 4. Chế độ Headless & Test Contract v1.2

Game tích hợp bộ mô phỏng logic độc lập không cần GPU/cửa sổ, tuân thủ 100% Test Contract v1.2:

```bash
# Chạy toàn bộ 60 test tự động và regression
npm test

# Chạy mô phỏng Headless xuất JSONL
node src/headless.js --seed 42 --night 1 --ticks 600 --out output.jsonl
node src/headless.js --seed 42 --night 1 --scenario tests/scenarios/scenario_fuel_decay.json --ticks 60 --out decay.jsonl
```

- **Tất định 100% (Byte-for-byte Determinism):** Cùng seed, scenario và inputs đảm bảo sinh ra output JSONL có mã băm SHA256 trùng khớp hoàn toàn.
- **Hiệu năng:** Mô phỏng 21,600 ticks trong **0.22 giây** (vượt xa mục tiêu <= 30 giây).
- **Mã lỗi exit code 2:** Bắt buộc thoát với mã lỗi `2` khi scenario hoặc inputs sai schema.

---

## 5. Cấu trúc Thư mục

```text
├── game.contract.json          # Đặc tả chuẩn Test Contract v1.2
├── AGENTS.md                   # Chỉ dẫn quy ước và kiến trúc cho AI Agent
├── CHANGELOG.md                # Lịch sử thay đổi qua từng Phase
├── docs/
│   ├── notes/
│   │   ├── adr-phase-3-fuel-system.md  # Architectural Decision Record (ADR-002)
│   │   └── phase-3-spec-assumptions.md # Đặc tả kỹ thuật & giả định
│   └── proof/
│       ├── phase-1-proof.md    # Bằng chứng kiểm thử Phase 1
│       ├── phase-2-proof.md    # Bằng chứng kiểm thử Phase 2
│       └── phase-3-proof.md    # Bằng chứng kiểm thử Phase 3 (60/60 pass)
├── src/
│   ├── core/
│   │   ├── rng.js              # PRNG LCG tất định 100%
│   │   ├── constants.js        # Hằng số chuẩn hóa & cấu hình bản đồ 3 Đêm
│   │   └── simulation.js       # Bộ mô phỏng 60 tick/s, thứ tự 12 bước
│   ├── client/
│   │   ├── game.js             # Three.js 3D WebGL renderer & logic kết nối
│   │   └── audio.js            # Web Audio API tổng hợp âm thanh thủ tục
│   ├── headless.js             # CLI chạy headless xuất JSONL
│   └── server.js               # HTTP static server phục vụ game
└── tests/
    ├── run-all-tests.js        # Test runner (60 test assertions)
    └── scenarios/              # Test scenarios chuẩn hóa cho Contract v1.2
```
