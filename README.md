# Đảo Đèn Lồng (Lantern Island) — 3D AI SDLC Game

> **Học viên:** Hồ Anh Dũng · **MSSV:** 03613 · **Khóa 5 - L3A**  
> **Video Demo:** [docs/demo/demo.mp4](docs/demo/demo.mp4)  
> **Lab Board:** [Đảo Đèn Lồng Lab](https://claude.ai/artifact/Q1RYyv1dxjUczzCbd2ZnoW)  
> **Phiên bản hiện tại:** Phase 2 (Ticket-02 — "Ba hòn đảo") · **Contract:** `v1.1` · **Tag:** `phase-2`

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

## 2. Hướng dẫn Điều khiển & Lối chơi (Phase 2)

- **Di chuyển:** Phím `W`, `A`, `S`, `D` hoặc các phím mũi tên.
- **Xoay Camera 3D:** Giữ chuột trái và di chuột để xoay góc nhìn.
- **Nhảy:** Phím `Space` (vận tốc Y 7.0 m/s, trọng lực -20 m/s², chỉ nhảy khi chạm đất).
- **Lướt (Dash - Mới):** Phím `Shift` hoặc `F`. Lướt 14 m/s trong 0.2s (12 ticks), hồi chiêu 1.5s (90 ticks). Lướt trên không giữ nguyên cao độ Y.
- **Thắp Đèn Lớn:** Phím `E` khi đứng gần đèn (< 2m). Mỗi đèn cần 10 đom đóm để thắp sáng (có thể nạp nhiều lần). Khi đèn sáng, tạo vùng an toàn 6m chặn và đẩy Bóng Mực ra mép.
- **Tỏa Sáng (Pulse):** Phím `Q` hoặc `Chuột Phải`. Tiêu tốn 3 đom đóm, bán kính 3D 5m, làm choáng Bóng Mực trong 2s (120 ticks) và đẩy lùi 4m. Nếu đánh trúng Gió Lạc đang đuổi, xua đuổi nó; nếu trúng lúc nó đang tẩu thoát mang đồ, nó sẽ rơi lại toàn bộ đom đóm.
- **Tạm dừng (Pause - Mới):** Phím `Esc` hoặc `P` để mở menu tạm dừng (Tiếp tục, Chơi lại Đêm, Cài đặt âm lượng/chuột, Về menu).

---

## 3. Hành Trình 3 Đêm (Phase 2 Maps)

1. **Đêm 1 — Đảo Bến:** Đảo tròn r=40m, 5 Đèn Lớn, 20 đom đóm khởi điểm, Bóng Mực sinh r=37m (thời lượng 300s).
2. **Đêm 2 — Đảo Cau (Mới):** Hai đảo tròn r=28m (Đảo A và Đảo B) nối bằng cầu tre x ∈ [26, 44]. Hai bục nhảy (vy=14 m/s, v_ngang=24 m/s) phóng qua lại giữa hai đảo. Có 6 Đèn Lớn, Bùa Gió trên cầu tre, và xuất hiện quái vật Gió Lạc (thời lượng 330s).
3. **Đêm 3 — Đảo Chuông (Mới):** Đảo tròn r=45m gồm 3 tầng (Tầng 0: Y=0, Tầng 1: Y=3, Tầng 2: Y=6). Bục nhảy phóng lên Tầng 2, có Tháp Chuông ở đỉnh, 7 Đèn Lớn, Gió Lạc, 2 Bùa Gió và các cơn gió mạnh thổi mỗi 30s (thời lượng 360s).

---

## 4. Cách Tính Điểm Chuẩn Hóa

- Nạp mỗi đom đóm vào đèn: **+10 điểm**
- Thắp sáng mỗi Đèn Lớn: **+100 điểm**
- Làm choáng Bóng Mực bằng Tỏa Sáng: **+5 điểm** (mỗi con mỗi lần)
- Thưởng khi chiến thắng Đêm:
  - **+2 điểm** cho mỗi giây thời gian còn lại (`floor(giây) × 2`).
  - **+50 điểm** cho mỗi Ngọn Lửa (HP) còn lại.
- **Tổng điểm game** là tổng điểm của các Đêm đã chiến thắng. Khi thắng Đêm 3, màn hình Bình Minh sẽ vinh danh tổng điểm.

---

## 5. Chế độ Headless & Test Contract v1.1

Game tích hợp bộ mô phỏng logic độc lập không cần GPU/cửa sổ, tuân thủ 100% Test Contract v1.1:

```bash
# Chạy headless cho Đêm 1:
node src/headless.js --seed 42 --night 1 --ticks 180 --out output.jsonl

# Chạy headless cho Đêm 2 hoặc Đêm 3:
node src/headless.js --seed 42 --night 2 --ticks 240 --out output.jsonl
node src/headless.js --seed 42 --night 3 --ticks 300 --out output.jsonl

# Chạy với scenario và inputs:
node src/headless.js --seed 42 --night 2 --scenario tests/scenarios/scenario_charm.json --inputs tests/scenarios/inputs_charm.json --ticks 20 --out output.jsonl
```

### Chạy toàn bộ bộ kiểm thử tự động
```bash
npm test
```
Bộ test bao gồm **39 bài kiểm tra tự động**:
- Kiểm tra tính tất định 100% (cùng seed cho mã băm SHA256 trùng khớp từng byte trên Đêm 1 và Đêm 2).
- Kiểm tra toàn diện cơ chế Lướt (Dash), Nhảy, Bục nhảy, Bùa Gió, Gió Lạc, Rơi khỏi đảo và Hồi sinh.
- Kiểm tra mã thoát lỗi `2` khi file scenario/inputs sai định dạng.
- **Benchmark hiệu năng:** 21,600 ticks hoàn thành trong **0.23 giây** (vượt xa chỉ tiêu <= 30s của contract).

---

## 6. Sáng Tạo Của Tôi (My Creativity)

Tuân thủ nguyên tắc không làm thay đổi hay ảnh hưởng đến Test Contract:
1. **Thiết kế nhân vật Mây mang bản sắc Việt Nam:** Mây đội nón lá tre vàng, thắt khăn đỏ truyền thống (`#C8102E`), áo nâu nhạt (`#E8E2D0`), đèn lồng nhỏ đung đưa theo chuyển động.
2. **Minimap Radar thời gian thực:** Bản đồ thu nhỏ góc trên bên phải cập nhật động cho cả Đảo Bến, Đảo Cau (2 đảo nối cầu) và Đảo Chuông (3 tầng).
3. **Mũi tên định hướng thông minh:** Mũi tên viền vàng xoay quanh mép màn hình chỉ trực tiếp về phía Đèn Lớn chưa thắp gần nhất khi đèn nằm ngoài góc nhìn.
4. **Bộ tổng hợp âm thanh đa tần (Web Audio API):** Âm thanh procedural riêng biệt cho lướt (tiếng vút gió), nhảy, nhặt đom đóm, chuông khánh đồng ngân vang khi thắp đèn, tiếng rít của Gió Lạc.
5. **Cài đặt cá nhân hóa:** Tùy chỉnh âm lượng và độ nhạy chuột được lưu tự động trong `localStorage`.

---

## 7. Cấu Trúc Thư Mục

```text
├── package.json               # Cấu hình dự án và scripts (start, test, headless)
├── game.contract.json         # Khai báo Test Contract v1.1 và tuning parameters
├── server.js                  # Máy chủ HTTP phục vụ Web 3D
├── index.html                 # Giao diện chính, HUD v1.1, bảng màu chuẩn
├── AGENTS.md                  # Hướng dẫn quy chuẩn cho Agent (Phase 2)
├── CREDITS.md                 # Ghi nhận bản quyền và thư viện
├── LICENSE                    # Giấy phép MIT
├── .agents/
│   └── skills/verification.md # Kỹ năng kiểm chứng tự động Phase 2
├── src/
│   ├── core/                  # Engine logic mô phỏng thuần túy (Headless 60Hz)
│   │   ├── rng.js             # Seeded PRNG (Mulberry32) tất định
│   │   ├── constants.js       # Tham số chuẩn & bản đồ 3 Đêm (Đảo Bến, Đảo Cau, Đảo Chuông)
│   │   └── simulation.js      # Mô phỏng 12 bước / tick, vật lý nhảy/lướt/bục nhảy/gió, thực thể
│   ├── client/                # Giao diện hiển thị Three.js & âm thanh
│   │   ├── game.js            # Khởi tạo 3D cho 3 Đêm, camera, kết nối core, HUD v1.1
│   │   └── audio.js           # Bộ tổng hợp âm thanh Web Audio (dash, jump, charm, hit, win...)
│   └── headless.js            # CLI runner cho Test Contract v1.1
├── tests/
│   ├── run-all-tests.js       # Suite kiểm thử tự động (39 bài test)
│   └── scenarios/             # Các kịch bản mẫu (pickup, deposit, pulse, dash, charm, drifter, pause...)
└── docs/
    ├── notes/                 # Tiêu chí nghiệm thu, nhật ký AI và retro
    └── proof/                 # Bằng chứng kiểm chứng ma trận yêu cầu Phase 2
```
