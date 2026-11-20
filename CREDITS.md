# CREDITS & ATTRIBUTIONS — Đảo Đèn Lồng (Lantern Island)

Dự án: **Đảo Đèn Lồng (Lantern Island)**  
Khóa học: **K5 - L3A AI SDLC (Day 12 Lab)**  
Học viên: **Hồ Anh Dũng (MSSV: 03613)**  

---

## 1. Công Cụ & Mô Hình AI (AI Assistance & Content Generation)

- **Antigravity (Google DeepMind)**: Trợ lý AI lập trình chính, hỗ trợ thiết kế kiến trúc hệ thống, quy trình 12 bước mô phỏng tất định (deterministic PRNG), tự động hóa kiểm thử hồi quy (60 test assertions), giải quyết các Change Request và phát hành v1.0.0.
- **Claude (Anthropic)**: Cung cấp yêu cầu nhiệm vụ, bản đặc tả kỹ thuật tương tác và các Ticket (Ticket-01 đến Ticket-04).

---

## 2. Thư Viện & Công Nghệ Mã Nguồn Mở (Open Source Libraries)

- **Three.js (v0.170.0)**:
  - Bản quyền (c) 2010-2024 Three.js Authors
  - Giấy phép: MIT License
  - Sử dụng cho kết xuất đồ họa 3D WebGL trên trình duyệt.
- **Node.js Runtime (v22.x)**:
  - Nền tảng thực thi headless simulation, soak test và benchmark test.

---

## 3. Âm Thanh Thủ Tục (Procedural Web Audio API)

- Toàn bộ âm thanh trong game được tổng hợp theo thời gian thực (real-time procedural audio synthesis) bằng **Web Audio API** thuần túy (`src/client/audio.js`):
  - **Mote Pickup**: Bộ dao động sóng sin 520Hz -> 880Hz (arpeggio chuông trong trẻo).
  - **Deposit / Refuel**: Hợp âm ngũ cung ấm áp (Pentatonic C-E-G-A).
  - **Lantern Lit**: Hợp âm vang vọng ngân dài kết hợp bộ lọc thông thấp (resonant lowpass filter).
  - **Pulse (Tỏa Sáng)**: Sóng xung kích sweep tần số kết hợp tiếng chuông ngân.
  - **Dash (Lướt)**: Tiếng rít gió (pink noise burst) tạo cảm giác tốc độ.
  - **Charm (Bùa Gió)**: Tiếng phong linh reo cao vút.
  - **Player Hit**: Tiếng dập lửa và va chạm trầm đục (decay envelope).
  - **Victory / Defeat**: Chuỗi giai điệu chiến thắng rực rỡ và khúc trầm bi tráng.
- Không sử dụng file âm thanh ngoài bản quyền; đảm bảo 100% dung lượng nhẹ và không vi phạm bản quyền.

---

## 4. Đồ Họa & Mô Hình 3D Thủ Tục (Procedural 3D Assets)

- Tất cả mô hình 3D đều được tạo theo thủ tục (procedural geometry) từ Three.js primitives:
  - **Nhân vật Mây**: Nón lá truyền thống Việt Nam (ConeGeometry), đèn lồng mini cầm tay, áo tơi nâu.
  - **Đèn Lồng Lớn (Grand Lanterns)**: Chân đế đá bát giác, trụ gỗ, lồng đèn giấy phát sáng, mái đình cong chạm khắc, thanh đo dầu 3D.
  - **Đom Đóm (Fireflies)**: Quả cầu phát sáng nhấp nháy chuyển động sóng sin.
  - **Bóng Mực (Shades)**: Khối đa diện bóng tối ma mị (DodecahedronGeometry) với đôi mắt phát sáng tím / xanh dương.
  - **Gió Lạc (Drifters)**: Dải lụa sương mù bay lượn màu xám bạc.
  - **Địa Hình Đảo**: Đảo tròn Đảo Bến, cặp đảo nối cầu tre Đảo Cau, đảo 3 tầng Đảo Chuông với tháp chuông đỉnh núi.
