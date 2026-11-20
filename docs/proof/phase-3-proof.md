# Bằng Chứng Xác Minh Phase 3 (Verification Proof - Phase 3)

- **Phiên bản Contract**: `v1.2`
- **Thời gian chạy**: 2026-11-20
- **Môi trường thực thi**: Node.js v22.18.0, Windows pwsh

---

## 1. Kết Quả Kiểm Thử Toàn Diện (`npm test`)

```text
=== RUNNING UNIT & REGRESSION TESTS (CONTRACT V1.2) ===
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
  PASS: Determinism verified on Night 2: identical SHA256 (2e32b03e...)
  PASS: CLI exits with code 2 on malformed inputs schema
  PASS: Performance benchmark: 21,600 ticks completed in 0.22s (<= 30s target)
  PASS: Lantern L1 extinguished after fuel reached 0
  PASS: Lantern L1 has ever_lit = true
  PASS: lantern_out event emitted
  PASS: Lantern refueled up to 100 fuel
  PASS: Player used 2 motes to refuel, 1 left
  PASS: Refueling 2 motes gave 10 points (5/mote)
  PASS: Lantern L1 successfully relit
  PASS: Lantern L1 relit_count is 1
  PASS: Relighting consumed 5 motes (10 - 5 = 5)
  PASS: Relight score awarded 25 (5*5 deposit) + 40 (relight) = 65
  PASS: Dynamic capacity increased to 12 (10 + 2*1)
  PASS: Shade S1 entered drain state at weak lantern
  PASS: fuel_drain event emitted
  PASS: Pulse event fired on draining shade
  PASS: Pulse on draining shade awarded +15 points
  PASS: Draining shade stunned
  PASS: Game state won at dawn with 3/5 lanterns lit
  PASS: Dawn reached (time_left_s = 0)
  PASS: game_over reason is dawn_survived
  PASS: Game does NOT win early when all lanterns lit (no early win)
  PASS: No game_over event before dawn

================================
TOTAL: 60 | PASSED: 60 | FAILED: 0
================================
```

---

## 2. Ma Trận Đối Soát Yêu Cầu TICKET-03 (Traceability Matrix)

| STT | Yêu cầu Ticket-03 | File & Hàm Triển Khai | Trạng thái Test |
| :--- | :--- | :--- | :--- |
| 1 | Nhiên liệu đèn: max 100, hao 1.0/s | `simulation.js` (Step 2) | PASS (Test 17) |
| 2 | Tắt đèn khi fuel <= 0 (`lantern_out`, `ever_lit: true`) | `simulation.js` (Step 2) | PASS (Test 17) |
| 3 | Châm dầu: nạp đom đóm, `refuel` event, +5 điểm/đom đóm | `simulation.js` (Step 5) | PASS (Test 18) |
| 4 | Thắp lại đèn đã tắt: chi phí 5 đom đóm, `relight: true`, +40 điểm | `simulation.js` (Step 5) | PASS (Test 19) |
| 5 | Sức chứa tăng dần (+2/lần thắp, max 20) | `simulation.js` (`getCapacity`) | PASS (Test 19) |
| 6 | Bóng Mực hút dầu (`drain`: 5.0/s khi fuel < 30, `fuel_drain` event) | `simulation.js` (Step 2 & 8) | PASS (Test 20) |
| 7 | Tỏa Sáng ngắt hút dầu (+15 điểm) | `simulation.js` (Step 7) | PASS (Test 21) |
| 8 | Thắng bình minh (`dawn_survived` khi lit >= ceil(0.6*N)) | `simulation.js` (Step 11) | PASS (Test 22) |
| 9 | Không còn thắng sớm khi thắp hết đèn | `simulation.js` (Step 11) | PASS (Test 23) |
| 10 | Benchmark hiệu năng 21,600 ticks trong <= 30s | `tests/run-all-tests.js` | PASS (0.22s) |
| 11 | Tất định 100% qua PRNG & SHA256 byte-for-byte | `tests/run-all-tests.js` | PASS (2e32b03e) |
| 12 | Chế độ mù màu (Colorblind mode) & UI thanh dầu 3D | `game.js`, `index.html` | Đã kiểm thử |
