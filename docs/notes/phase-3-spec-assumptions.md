# Phase 3 - Đặc Tả Kỹ Thuật & Giả Định (Spec & Assumptions) - Contract v1.2

Dự án: **Đảo Đèn Lồng (Lantern Island)**
Phase: **Phase 3 (TICKET-03 Change Request "Đèn cạn dầu")**

---

## 1. Mục Tiêu & Phạm Vi
Thực thi toàn diện các yêu cầu kỹ thuật của Ticket-03:
- Nâng cấp Test Contract lên phiên bản `v1.2`.
- Cơ chế Nhiên liệu đèn (Fuel Decay: 1.0/s, Max: 100, Châm dầu: +10/đom đóm, Thắp lại: 5 đom đóm).
- Cơ chế Bóng Mực hút dầu (`drain`: 5.0/s khi đèn `< 30` fuel, mất vùng an toàn).
- Thưởng điểm Tỏa Sáng khi ngắt hút dầu (+15 điểm).
- Điều kiện Thắng / Thua mới: Không còn thắng sớm khi thắp hết đèn; kết thúc lúc bình minh (`dawn_survived` nếu lit >= `ceil(0.6 * N)`).
- Sức chứa tăng dần (10 + 2 * successful_lights, tối đa 20).
- Chế độ Mù màu (Colorblind Mode: mắt bóng `#00B3FF`, cảnh báo màu trắng với ⚠, đèn tắt dẹt 20%).

---

## 2. Thông Số Chuẩn Hóa (Tuning Constants v1.2)

| Hằng số | Giá trị v1.2 | Ghi chú |
| :--- | :--- | :--- |
| `contract_version` | `"1.2"` | Schema Contract v1.2 |
| `night1_duration_s` | `240` | 4 phút |
| `night2_duration_s` | `270` | 4.5 phút |
| `night3_duration_s` | `300` | 5 phút |
| `fuel_max` | `100.0` | Nhiên liệu tối đa của đèn |
| `fuel_decay_per_s` | `1.0` | Tự hao 1 tick (1/60) mỗi tick |
| `fuel_per_mote` | `10.0` | Mỗi đom đóm châm được 10 dầu |
| `low_fuel_threshold`| `30.0` | Ngưỡng mất vùng an toàn & nhấp nháy 1 Hz |
| `drain_per_s` | `5.0` | Tốc độ hút của 1 Bóng Mực (5/60 mỗi tick) |
| `relight_cost` | `5` | Chi phí thắp lại đèn từng sáng (`ever_lit`) |
| `carry_capacity` | `10` | Sức chứa cơ bản |
| `capacity_max` | `20` | Sức chứa tối đa (+2 mỗi lần thắp thành công) |
| `win_ratio` | `0.6` | Tỷ lệ đèn sáng tối thiểu lúc bình minh |
| Điểm nạp đom đóm | `+5` | Thay vì +10 cũ |
| Điểm thắp lần đầu | `+100` | |
| Điểm thắp lại | `+40` | |
| Điểm Pulse choáng | `+5` | Choáng bóng bình thường |
| Điểm Pulse ngắt drain| `+15` | Choáng bóng đang hút dầu |
| Điểm thắng Dawn | `+50 + floor(fuel)` | Mỗi đèn đang sáng tại tick cuối |
| Điểm Ngọn Lửa Dawn | `+50` | Mỗi Ngọn Lửa còn lại |

---

## 3. Giả Định Kỹ Thuật (Assumptions)
1. **Làm tròn Snapshot**:
   - `fuel`: làm tròn 1 chữ số thập phân (`round1`).
   - `capacity`: số nguyên xuất trong `player.capacity`.
2. **Ưu tiên chọn đèn khi tương tác**:
   - Chỉ xét đèn có thể nhận thêm đom đóm: hoặc `!lit`, hoặc `lit && fuel < 100`.
   - Chọn đèn gần nhất `<= 2.0m`; nếu bằng nhau thì chọn id theo thứ tự từ điển nhỏ hơn.
3. **Thắp thành công (successful_lights)**:
   - Tính cả thắp lần đầu và thắp lại.
   - Không tính đèn đặt sẵn `lit: true` từ scenario lúc khởi tạo.
   - Đặt lại về 0 ở đầu mỗi Đêm.
