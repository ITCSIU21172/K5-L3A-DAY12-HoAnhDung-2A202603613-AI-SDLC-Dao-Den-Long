# Bằng Chứng Kiểm Chứng (Verification Proof) - Phase 2 (Ticket-02)

Dự án: **Đảo Đèn Lồng (Lantern Island)**
Tác giả: Hồ Anh Dũng (MSSV: 03613) · Contract: **v1.1** · Tag: **phase-2**

---

## 1. Ma Trận Truy Vết Yêu Cầu (Requirement Traceability Matrix)

| Mã AC | Yêu cầu kỹ thuật | Cách thức kiểm chứng | Kết quả kiểm chứng | Đánh giá |
|---|---|---|---|---|
| **AC-01** | Chuẩn hóa tốc độ chạy 6.0 m/s | Kiểm tra vector di chuyển trong `Simulation.step` | Tọa độ tăng chính xác `6.0 * dt` mỗi tick | **ĐẠT** |
| **AC-02** | Cơ chế Nhảy (vy = 7.0, g = -20) | Test điều kiện `grounded` và vận tốc rơi | Vận tốc Y gán 7.0, giảm 20 m/s², chạm đất hồi `grounded` | **ĐẠT** |
| **AC-03** | Cơ chế Lướt (Dash: 14 m/s, 12 ticks, cd 90 ticks) | Scenario `scenario_dash.json` & `inputs_dash.json` | Phát ra event `dash`, duy trì cao độ Y, cooldown 90 ticks | **ĐẠT** |
| **AC-04** | Túi đom đóm sức chứa 10, bán kính nhặt 1.0m, trần 30 con | Unit test `mote_picked` & scheduler | Túi chứa tối đa 10, nhặt đúng bán kính XZ <= 1.0, dY <= 1.5 | **ĐẠT** |
| **AC-05** | Đèn Lớn chi phí 10, vùng an toàn 6m đẩy bóng mực | Unit test nạp 10 đom đóm & cơ chế đẩy lùi | Đèn sáng khi nạp đủ 10; bóng mực bị đẩy ra mép 6m trong 30 ticks | **ĐẠT** |
| **AC-06** | Tỏa Sáng (3 đom đóm, 3D r <= 5m, choáng 120 ticks, đẩy 4m) | Scenario `scenario_pulse.json` | Choáng đúng 120 ticks, đẩy 4m trong 15 ticks, trừ 3 đom đóm | **ĐẠT** |
| **AC-07** | Đêm 1: Đảo Bến (r=40m, 5 đèn, 300s) | Headless run `--night 1` | Bản đồ sinh đúng 5 đèn, thời lượng 300s | **ĐẠT** |
| **AC-08** | Đêm 2: Đảo Cau (2 đảo r=28m, cầu tre, 2 bục nhảy, 6 đèn, 330s) | Headless run `--night 2` | 6 đèn, bục nhảy kích hoạt bay đạn đạo vy=14, v_ngang=24 | **ĐẠT** |
| **AC-09** | Đêm 3: Đảo Chuông (3 tầng, dốc, tháp chuông, 7 đèn, gió mạnh, 360s) | Headless run `--night 3` | 7 đèn, địa hình 3 cao độ Y=0/3/6, gió đổi hướng mỗi 30s | **ĐẠT** |
| **AC-10** | Gió Lạc (Drifter): cướp 3 đom đóm khi mang >= 5, rơi khi bị Pulse | Scenario `scenario_drifter.json` | Phát event `drifter_steal`, chuyển `flee`, rơi đom đóm khi dính Pulse | **ĐẠT** |
| **AC-11** | Bùa Gió (Wind Charm): tốc độ 7.2 m/s, lướt không hồi chiêu | Scenario `scenario_charm.json` & `inputs_charm.json` | Phát event `charm_picked`, buff 600 ticks, dash cd = 0 | **ĐẠT** |
| **AC-12** | Rơi khỏi đảo Y < -10m: mất 1 máu, chờ 60 ticks rồi hồi sinh | Rơi khỏi đảo test | Mất 1 máu, mất đom đóm, hồi sinh ở (0,0,0) sau 60 ticks | **ĐẠT** |
| **AC-13** | Tạm dừng (Pause): ngưng toàn bộ logic, snapshot state "paused" | Scenario `scenario_pause.json` & `inputs_pause.json` | Phát event `paused`/`resumed`, snapshot ghi state `paused` | **ĐẠT** |
| **AC-14** | Tính tất định (Determinism) theo Contract v1.1 | Chạy 2 lần với seed 7777 trên Night 2 | Hai file JSONL trùng khớp hoàn toàn mã SHA256 `e326889f...` | **ĐẠT** |
| **AC-15** | Hiệu năng Headless 21,600 ticks trong <= 30 giây | Chạy benchmark 21,600 ticks | Hoàn thành trong **0.23 giây** (vượt xa chỉ tiêu <= 30s) | **ĐẠT** |

---

## 2. Kết Quả Kiểm Thử Toàn Diện (Regression + New Features)

```text
> dao-den-long@1.0.0 test
> node tests/run-all-tests.js

=== RUNNING UNIT & REGRESSION TESTS (CONTRACT V1.1) ===
  PASS: PRNG is 100% deterministic with same seed
  PASS: Mote picked up within pickup radius <= 1.0m
  PASS: Player carried count incremented to 1
  PASS: Deposit event emitted
  PASS: Lantern lit event emitted when cost 10 reached
  PASS: Carried motes depleted after full deposit
  PASS: Lantern L1 is marked lit
  PASS: Pulse event emitted
  PASS: Shade enters stunned state for 120 ticks
  PASS: Pulse consumed exactly 3 motes
  PASS: Pulse awarded +5 score per shade hit
  PASS: Player hit event emitted
  PASS: Player lost 1 flame
  PASS: Player dropped 50% of motes (3/6)
  PASS: Dropped motes spawned in surrounding ring
  PASS: Dash event emitted on rising edge
  PASS: Dash timer active (12 ticks total)
  PASS: Dash cooldown initialized to 90 ticks (1.5s)
  PASS: Charm picked event emitted
  PASS: Charm buff active for 600 ticks
  PASS: Drifter steal event emitted
  PASS: Drifter stole exactly min(3, carried) = 3 motes
  PASS: Drifter switched to flee state
  PASS: Paused event emitted
  PASS: Simulation state entered pause mode
  PASS: Night 1 has 5 lanterns
  PASS: Night 2 has 6 lanterns (Đảo Cau)
  PASS: Night 3 has 7 lanterns (Đảo Chuông)
  PASS: Night 2 has 2 jump pads connecting the two islands
  PASS: Night 3 has jump pad to tier 2

=== RUNNING HEADLESS CLI & CONTRACT SCENARIOS ===
  PASS: Snapshot 0 has night = 1
  PASS: Snapshot has motes array
  PASS: Snapshot has charms array
  PASS: Snapshot has drifters array
  PASS: Snapshot has night = 2 with Đảo Cau map
  PASS: Snapshot has night = 3 with Đảo Chuông map
  PASS: Determinism verified on Night 2: identical SHA256 (e326889f...)
  PASS: CLI exits with code 2 on malformed inputs schema
  PASS: Performance benchmark: 21,600 ticks completed in 0.23s (<= 30s target)

================================
TOTAL: 39 | PASSED: 39 | FAILED: 0
================================
```
