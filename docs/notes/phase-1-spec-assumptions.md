# Đặc Tả & Giả Định: Phase 1 (PRD-0)

Dự án: **Đảo Đèn Lồng (Lantern Island)**
Tác giả: Hồ Anh Dũng (MSSV: 03613)

---

## 1. Yêu cầu bắt buộc & Cố định (Test Contract v1.0)
- Tốc độ mô phỏng logic: 60 tick/giây (1 tick = 1/60s).
- Hệ tọa độ: Trục Y hướng lên; mặt đất ở Y = 0; nhân vật xuất phát tại (0, 0, 0).
- Khoảng cách đo trên mặt phẳng ngang XZ.
- Định dạng JSONL:
  - Snapshot ở tick 0 và mỗi `--snapshot-every` tick.
  - Events ghi ngay khi phát sinh trong tick.
  - Dòng cuối cùng bắt buộc là `end` ghi tổng số tick, trạng thái (`playing`, `won`, `lost`) và điểm số.
  - Mã thoát: `0` khi hoàn thành, `2` khi scenario/inputs sai định dạng.

## 2. Các giả định hợp lý cho phần mơ hồ trong PRD-0
1. **Bố trí 5 Đèn Lồng Lớn**:
   - Được phân bố đối xứng ngũ giác ở bán kính 25m quanh đảo:
     - `L1`: (0, 0, 25.0)
     - `L2`: (23.776, 0, 7.725)
     - `L3`: (14.695, 0, -20.225)
     - `L4`: (-14.695, 0, -20.225)
     - `L5`: (-23.776, 0, 7.725)
2. **Chi phí và sức chứa**:
   - Sức chứa đom đóm của Mây (`carry_capacity`): 5 con.
   - Chi phí thắp mỗi Đèn Lớn (`lantern_cost`): 3 đom đóm.
   - Chi phí kỹ năng Tỏa Sáng (`pulse_cost`): 1 đom đóm mang theo.
   - Bán kính an toàn của Đèn Lớn (`safe_radius`): 5m (Bóng Mực không thể tiến vào vùng này khi đèn đã thắp).
3. **Cơ chế sát thương & Bất tử**:
   - Số ngọn lửa khởi điểm (`flames`): 3.
   - Khi bị Bóng Mực chạm: mất 1 ngọn lửa, rơi 50% số đom đóm đang mang (`hit_drop_ratio = 0.5`), nhận 2 giây bất tử (`invuln_s = 2.0`).
4. **Kỹ năng Tỏa Sáng (Pulse)**:
   - Bán kính hiệu ứng (`pulse_radius`): 8m.
   - Thời gian làm choáng Bóng Mực (`pulse_stun_s`): 4 giây.
   - Khoảng cách đẩy lùi Bóng Mực (`pulse_push_m`): 4m.
   - Hồi chiêu (`pulse_cooldown_s`): 3 giây.
5. **Thời lượng màn chơi**:
   - `night1_duration_s`: 180 giây (3 phút) - thời gian hợp lý cho Đêm 1 để trải nghiệm trọn vẹn vòng lặp thu thập, né tránh và thắp đèn.
6. **Công thức tính điểm**:
   - Nhặt đom đóm: +10 điểm.
   - Thắp sáng Đèn Lớn: +200 điểm.
   - Làm choáng Bóng Mực: +50 điểm.
   - Thắng cuộc: +5 điểm cho mỗi giây còn lại (`per_second_left`), +100 điểm cho mỗi ngọn lửa còn lại (`per_flame_left`).
