# Đảo Đèn Lồng (Lantern Island) — 3D AI SDLC Game

> **Học viên:** Hồ Anh Dũng · **MSSV:** 03613 · **Khóa 5 - L3A**  
> **Video Demo:** [docs/demo/demo.mp4](docs/demo/demo.mp4)  
> **Lab Board:** [Đảo Đèn Lồng Lab](https://claude.ai/artifact/Q1RYyv1dxjUczzCbd2ZnoW)

---

## 1. Cài đặt & Khởi chạy (Tối đa 2 lệnh)

Game chạy đa nền tảng (Windows, macOS, Linux) thông qua nền tảng Web 3D (Three.js) và Node.js:

```bash
# 1. Cài đặt phụ thuộc
npm install

# 2. Khởi chạy game
npm start
```
Sau đó mở trình duyệt tại: **http://localhost:3000**

---

## 2. Hướng dẫn Điều khiển & Lối chơi

- **Di chuyển:** Phím `W`, `A`, `S`, `D` hoặc các phím mũi tên.
- **Xoay góc nhìn (Camera 3D):** Di chuột (chuột trái giữ để xoay quanh nhân vật).
- **Nhảy:** Phím `Space`.
- **Thắp Đèn Lớn:** Phím `E` khi lại gần một Đèn Lớn chưa thắp. Yêu cầu có ít nhất 1 đom đóm trong túi. Mỗi đèn cần nạp đủ 3 đom đóm để bừng sáng.
- **Tỏa Sáng (Pulse):** Phím `Q` hoặc `Chuột Phải`. Tiêu tốn 1 đom đóm mang theo để phát ra làn sóng ánh sáng bán kính 8m, đẩy lùi và làm choáng Bóng Mực trong 4 giây.
- **Mục tiêu:** Thu thập đom đóm rải rác trên Đảo Bến, thắp sáng cả 5 Đèn Lồng Lớn trước khi trời sáng (180 giây) và né tránh Bóng Mực.

---

## 3. Cách tính điểm (Scoring)

- Nhặt mỗi đom đóm: **+10 điểm**
- Thắp sáng mỗi Đèn Lớn: **+200 điểm**
- Làm choáng Bóng Mực bằng Tỏa Sáng: **+50 điểm**
- Thưởng khi chiến thắng (thắp đủ 5 đèn):
  - **+5 điểm** cho mỗi giây thời gian còn lại.
  - **+100 điểm** cho mỗi ngọn lửa (máu) còn giữ được.

---

## 4. Chế độ Headless & Test Contract v1.0

Game tích hợp bộ mô phỏng logic độc lập không cần GPU/cửa sổ, tuân thủ 100% Test Contract v1.0:

```bash
# Chạy headless cơ bản:
node src/headless.js --seed 42 --night 1 --ticks 180 --out output.jsonl

# Chạy với scenario và inputs tùy biến:
node src/headless.js --seed 42 --night 1 --scenario tests/scenarios/scenario_pickup.json --inputs tests/scenarios/inputs_pickup.json --ticks 25 --out output.jsonl
```

### Chạy toàn bộ bộ kiểm thử tự động
```bash
npm test
```
Bộ test bao gồm 24 bài kiểm tra tự động:
- Kiểm tra tính tất định 100% (cùng seed cho mã băm SHA256 trùng khớp từng byte).
- Kiểm tra cơ chế nhặt đom đóm, nạp đèn, làm choáng bóng mực, nhận sát thương, điều kiện thắng/thua.
- Kiểm tra mã thoát lỗi `2` khi file scenario/inputs sai định dạng.

---

## 5. Sáng tạo của tôi (My Creativity)

Tuân thủ nguyên tắc không làm thay đổi hay ảnh hưởng đến Test Contract:
1. **Thiết kế nhân vật Mây mang bản sắc Việt Nam:** Nhân vật đội nón lá tre vàng truyền thống, trên vành nón treo một chiếc đèn lồng nhỏ phát ra vệt sáng ấm áp dẫn lối trong sương đêm.
2. **Minimap Radar thời gian thực:** Bản đồ thu nhỏ góc trên bên phải vẽ trực tiếp bằng Canvas 2D hiển thị vị trí của Mây, 5 Đèn Lớn (đổi màu vàng rực khi thắp), các đốm đom đóm và bóng mực.
3. **Bộ tổng hợp âm thanh đa tần (Procedural Web Audio):** Toàn bộ hiệu ứng âm thanh (nhặt đom đóm lấp lánh, tiếng chuông đồng trầm ấm khi thắp đèn, tiếng sóng ánh sáng, tiếng va chạm) được tổng hợp trực tiếp bằng Web Audio API, không phụ thuộc tài nguyên bên ngoài.
4. **Hiệu ứng ánh sáng lan tỏa:** Khi một Đèn Lớn được thắp, ánh sáng ấm áp lan tỏa xua tan màn sương tím đen, tạo cảm giác cổ tích ấm cúng.

---

## 6. Cấu trúc thư mục

```text
├── package.json               # Cấu hình dự án và scripts (start, test, headless)
├── game.contract.json         # Khai báo Test Contract v1.0 và tuning parameters
├── server.js                  # Máy chủ HTTP phục vụ Web 3D
├── index.html                 # Giao diện chính và HUD
├── AGENTS.md                  # Hướng dẫn quy chuẩn cho Agent
├── CREDITS.md                 # Ghi nhận bản quyền và thư viện
├── LICENSE                    # Giấy phép MIT
├── .agents/
│   └── skills/verification.md # Kỹ năng kiểm chứng tự động
├── src/
│   ├── core/                  # Engine logic mô phỏng thuần túy (Headless)
│   │   ├── rng.js             # Seeded PRNG (Mulberry32) tất định
│   │   ├── constants.js       # Tham số mặc định
│   │   └── simulation.js      # Mô phỏng 60 ticks/s, trạng thái và sự kiện
│   ├── client/                # Giao diện hiển thị Three.js & âm thanh
│   │   ├── game.js            # Khởi tạo 3D, điều khiển, camera, kết nối core
│   │   └── audio.js           # Bộ tổng hợp âm thanh Web Audio
│   └── headless.js            # CLI runner cho Test Contract v1.0
├── tests/
│   ├── run-all-tests.js       # Suite kiểm thử tự động
│   └── scenarios/             # Các kịch bản mẫu (pickup, deposit, pulse, win...)
└── docs/
    ├── notes/                 # Đặc tả, giả định, nhật ký AI và retro
    └── proof/                 # Bằng chứng kiểm chứng ma trận yêu cầu
```
