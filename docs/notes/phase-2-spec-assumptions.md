# Tiêu Chí Nghiệm Thu & Đặc Tả: Phase 2 (Ticket-02)

Dự án: **Đảo Đèn Lồng (Lantern Island)**
Ticket: **TICKET-02: "Ba hòn đảo"** · Contract: **v1.1** · Tag: **phase-2**
Tác giả: Hồ Anh Dũng (MSSV: 03613)

---

## 1. Tiêu Chí Nghiệm Thu (Acceptance Criteria)

### A. Chuẩn Hóa Số Liệu (Standardized Physics & Constants)
- **AC-01 (Di chuyển)**: Tốc độ chạy 6.0 m/s; tăng tốc và dừng trong <= 0.1 s; điều khiển trên không đầy đủ.
- **AC-02 (Nhảy)**: Vận tốc ban đầu 7.0 m/s, trọng lực -20.0 m/s², chỉ được kích hoạt khi chân nhân vật chạm đất (`grounded === true`).
- **AC-03 (Lướt - Dash)**: Tốc độ 14.0 m/s, kéo dài 0.2 s (12 ticks), hồi chiêu 1.5 s (90 ticks). Lướt theo hướng di chuyển hiện tại (hoặc hướng mặt nếu đứng yên). Lướt trên không giữ nguyên cao độ Y (`vy = 0`). Không có trạng thái bất tử khi lướt.
- **AC-04 (Đom đóm)**: Sức chứa túi tăng lên 10 con. Nhặt tự động khi khoảng cách XZ <= 1.0 m và chênh lệch cao độ Y <= 1.5 m. Bắt đầu với 20 đom đóm tại 20 điểm khác nhau; trần 30 con; cứ mỗi 240 ticks (4s) sinh thêm 1 con tại điểm trống nếu tổng số < 30.
- **AC-05 (Đèn lồng)**: Chi phí thắp sáng là 10 đom đóm; cho phép nạp nhiều lần (nhớ tiến độ). Tương tác trong bán kính 2.0 m; nạp `min(đang mang, còn thiếu)` vào đèn gần nhất. Khi thắp sáng, tạo vùng an toàn bán kính 6.0 m (chặn Bóng Mực bên ngoài; đẩy bóng mực bên trong ra mép trong 30 ticks không gây sát thương).
- **AC-06 (Tỏa Sáng - Pulse)**: Chi phí 3 đom đóm, hồi chiêu 3.0 s (180 ticks). Tâm xuất phát tại chân Mây + 0.8 m; bán kính 3D <= 5.0 m. Bóng Mực trúng chiêu bị choáng 120 ticks, bị đẩy lùi 4.0 m theo phương ngang trong 15 ticks đầu. Làm mới choáng và đẩy lùi nếu dính đòn tiếp.

### B. Mở Rộng 3 Đêm & Bản Đồ Chuẩn
- **AC-07 (Đêm 1 - Đảo Bến)**: Đảo tròn bán kính 40 m, 5 Đèn Lớn L1..L5, 20 đom đóm khởi điểm, Bóng Mực sinh trên bán kính 37 m (2 con lúc 5s, sau đó mỗi 8s 1 con, tối đa 6 con). Thời lượng 300 s.
- **AC-08 (Đêm 2 - Đảo Cau)**: Hai đảo tròn bán kính 28 m nối bằng cầu tre x ∈ [26, 44], z ∈ [-2, 2]. Hai bục nhảy tại (20,0,18) và (50,0,-18) bắn người chơi qua tâm đảo đối diện với vy = 14 m/s và v_ngang = 24 m/s. 6 Đèn Lớn L1..L6. Thời lượng 330 s.
- **AC-09 (Đêm 3 - Đảo Chuông)**: Đảo tròn bán kính 45 m gồm 3 tầng (Tầng 0: Y=0, Tầng 1: Y=3 r=12-24m, Tầng 2: Y=6 r=8m). 2 dốc thẳng 3m tại 30° và 150°. Bục nhảy tại (0,3,13) phóng lên Tầng 2. Tháp chuông trụ r=2m cao 8m ở tâm. 7 Đèn Lớn L1..L7. Gió mạnh mỗi 30s thổi trong 5s đẩy 2 m/s. Thời lượng 360 s.

### C. Thực Thể & Tính Năng Mới
- **AC-10 (Gió Lạc - Drifter)**: Xuất hiện ở Đêm 2 và 3, bay nhanh 7.0 m/s. Trạng thái `idle` (2 m/s) chuyển sang `chase` khi Mây mang >= 5 đom đóm và khoảng cách <= 15 m. Khi chạm XZ <= 1.2 m, cướp `min(3, đang mang)` đom đóm và chuyển `flee` bay xa trong 240 ticks rồi biến mất. Trúng Tỏa Sáng khi chase sẽ chuyển flee không cướp; trúng khi flee sẽ rơi lại toàn bộ đom đóm đã cướp.
- **AC-11 (Bùa Gió - Charm)**: Bùa đỏ viền vàng tại Đêm 2 (35,0,0) và Đêm 3 ((30,0,25), (-30,0,25)). Tăng tốc chạy lên 7.2 m/s và hồi chiêu Lướt = 0 trong 600 ticks. Tự hồi lại sau 2700 ticks.
- **AC-12 (Rơi khỏi đảo)**: Rơi xuống Y < -10 m: mất 1 Ngọn Lửa, mất toàn bộ đom đóm mang theo. Đợi 60 ticks (không nhặt đồ, không bị chạm), sau đó hồi sinh tại (0,0,0) với vận tốc 0, bất tử 90 ticks.
- **AC-13 (Tạm dừng - Pause)**: Phím `Esc` hoặc `P` dừng toàn bộ logic game; snapshot ghi `state: "paused"`. Menu tạm dừng cho phép Tiếp tục, Chơi lại Đêm, Cài đặt và Về menu.
- **AC-14 (Cài đặt lưu trữ)**: Lưu âm lượng và độ nhạy chuột vào `localStorage`.
- **AC-15 (HUD & Bảng màu)**: Bảng màu chuẩn 8 nhóm màu; đồng hồ đếm ngược nhấp nháy đỏ khi <= 30s; thanh đom đóm 10 ô; mũi tên chỉ hướng đèn chưa thắp ngoài màn hình.
