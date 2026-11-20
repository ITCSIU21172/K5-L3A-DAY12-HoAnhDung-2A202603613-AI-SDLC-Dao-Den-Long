# Bằng Chứng Kiểm Chứng (Verification Proof) - Phase 1

Dự án: **Đảo Đèn Lồng (Lantern Island)**
Tác giả: Hồ Anh Dũng (MSSV: 03613)

---

## 1. Ma trận truy vết yêu cầu (Requirement Traceability Matrix)

| Yêu cầu (PRD-0 & Contract v1.0) | Cách kiểm chứng | Bằng chứng thực tế | Kết quả |
|---|---|---|---|
| **REQ-01**: Nhân vật Mây di chuyển, camera 3D, hệ tọa độ Y lên | Scenario `inputs_pickup.json` & test di chuyển | Vector di chuyển được tính đúng góc yaw, cập nhật tọa độ XZ | **ĐẠT** |
| **REQ-02**: Thu thập đom đóm rải rác trên đảo khi trong bán kính `pickup_radius` | Unit test & Scenario `scenario_pickup.json` | Phát ra event `mote_picked`, tăng `carried`, trừ đom đóm trên đảo | **ĐẠT** |
| **REQ-03**: Thắp Đèn Lớn khi tương tác trong `interact_radius` | Unit test & Scenario `scenario_deposit.json` | Phát ra event `deposit` và `lantern_lit` khi đủ `lantern_cost` | **ĐẠT** |
| **REQ-04**: Bóng Mực đuổi theo người chơi, gây sát thương khi chạm | Unit test & Scenario `scenario_shade_hit.json` | Phát ra event `player_hit`, trừ `flames`, rơi 50% đom đóm | **ĐẠT** |
| **REQ-05**: Kỹ năng Tỏa Sáng (Pulse) làm choáng và đẩy lùi Bóng Mực | Unit test & Scenario `scenario_pulse.json` | Phát ra event `pulse` với `stunned_ids`, Bóng Mực đổi state `stunned` và bị đẩy lùi | **ĐẠT** |
| **REQ-06**: Vùng an toàn của Đèn Lớn (`safe_radius`) | Kiểm tra logic vị trí Bóng Mực trong simulation | Bóng Mực bị chặn không thể đi vào bán kính 5m quanh đèn đã thắp | **ĐẠT** |
| **REQ-07**: Điều kiện Thắng (Thắp đủ 5 Đèn Lớn) | Unit test & Scenario `scenario_win.json` | Phát ra event `game_over` (`result: "won", reason: "all_lit"`) | **ĐẠT** |
| **REQ-08**: Điều kiện Thua (Hết máu hoặc hết thời gian) | Unit test kiểm tra `flames <= 0` và `time_left_s <= 0` | Phát ra event `game_over` (`result: "lost", reason: "no_flames" / "dawn"`) | **ĐẠT** |
| **REQ-09**: Tính tất định (Determinism) theo Test Contract v1.0 | Chạy 2 lần với seed 98765, so sánh SHA256 output | Hai file `.jsonl` trùng khớp SHA256 `d27b18bd...` 100% | **ĐẠT** |
| **REQ-10**: Báo lỗi định dạng với mã thoát `2` | Chạy headless với scenario sai schema | CLI in lỗi ra stderr và thoát đúng mã `2` | **ĐẠT** |

---

## 2. Nhật ký chạy kiểm thử tự động
```text
> dao-den-long@1.0.0 test
> node tests/run-all-tests.js

=== RUNNING UNIT TESTS ===
  PASS: PRNG is 100% deterministic with same seed
  PASS: Mote picked up within pickup radius
  PASS: Player carried count incremented
  PASS: Mote removed from island
  PASS: Deposit event emitted
  PASS: Lantern lit event emitted when cost reached
  PASS: Carried motes depleted after deposit
  PASS: Lantern L1 is lit
  PASS: Pulse event emitted
  PASS: Shade enters stunned state
  PASS: Shade pushed back away from player
  PASS: Pulse consumed 1 mote
  PASS: Player hit event emitted
  PASS: Player lost 1 flame
  PASS: Player dropped 50% of motes
  PASS: Player gains invulnerability duration
  PASS: Game state transitions to won
  PASS: Game over event emitted with result won

=== RUNNING HEADLESS CLI & CONTRACT TESTS ===
  PASS: CLI produced out_pickup.jsonl
  PASS: Output contains JSONL lines
  PASS: Headless run detected mote_picked event
  PASS: Headless run completed with end state won
  PASS: Determinism verified: identical SHA256 hashes (d27b18bd...)
  PASS: CLI exits with code 2 on malformed scenario/inputs schema

================================
TOTAL: 24 | PASSED: 24 | FAILED: 0
================================
```
