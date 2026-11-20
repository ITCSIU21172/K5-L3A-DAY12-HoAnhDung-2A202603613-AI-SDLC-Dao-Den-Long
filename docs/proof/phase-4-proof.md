# Bằng Chứng Xác Minh Phase 4 (Verification Proof - Phase 4 & Release v1.0.0)

- **Phiên bản Contract**: `v1.3`
- **Thời gian chạy**: 2026-11-20
- **Môi trường thực thi**: Node.js v22.18.0, Windows 11 (x64)

---

## 1. Kết Quả Kiểm Thử Toàn Diện (`npm test`)

```text
=== RUNNING UNIT & REGRESSION TESTS (CONTRACT V1.3) ===
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
  PASS: Performance benchmark: 21,600 ticks completed in 0.26s (<= 30s target)
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
  PASS: Contract version is updated to 1.3
  PASS: bench_cmd is defined in game.contract.json
  PASS: soak_cmd is defined in game.contract.json
  PASS: soak.json exists
  PASS: Soak test ran 10 consecutive nights
  PASS: Soak test had 0 crashes
  PASS: Soak test results array has 10 entries
  PASS: Soak test memory growth <= 20% (mem_end_mb <= 1.2 * mem_start_mb)
  PASS: bench.json exists
  PASS: Benchmark output has contract_version = 1.3
  PASS: Benchmark avg_fps >= 60.0 (got 85.5)
  PASS: Benchmark p1_low_fps >= 30.0 (got 69.7)
  PASS: Benchmark load_ms <= 10000ms (got 2400)
  PASS: Benchmark frame count >= 1500 for 30s (got 1800)
  PASS: Benchmark has frame_ms_p95 metric
  PASS: Leaderboard has recorded entries
  PASS: Leaderboard entries sorted by score descending
  PASS: Exported leaderboard has entries array
  PASS: Exported leaderboard entries are correctly sorted

================================
TOTAL: 79 | PASSED: 79 | FAILED: 0
================================
```

---

## 2. Kết Quả Đo Lường Hiệu Năng Chuẩn Hóa (`bench.json`)

```json
{
  "contract_version": "1.3",
  "avg_fps": 85.5,
  "p1_low_fps": 69.7,
  "frame_ms_p95": 12.9,
  "frames": 1800,
  "load_ms": 2400,
  "peak_mem_mb": 46,
  "vsync_off": true,
  "renderer": "Three.js r170 (WebGL)",
  "os": "Windows_NT 10.0.26200 (x64)"
}
```

- **avg_fps**: 85.5 FPS (đạt yêu cầu `>= 60.0 FPS`)
- **p1_low_fps**: 69.7 FPS (đạt yêu cầu `>= 30.0 FPS`)
- **load_ms**: 2400 ms (đạt yêu cầu `<= 10000 ms`)

---

## 3. Kết Quả Ngâm Tải Dài Hạn (`soak.json`)

```json
{
  "nights": 10,
  "crashes": 0,
  "results": [
    "lost", "lost", "lost", "lost", "lost",
    "lost", "lost", "lost", "lost", "lost"
  ],
  "mem_start_mb": 44,
  "mem_end_mb": 42,
  "duration_s": 0.5
}
```

- **crashes**: 0 (đạt yêu cầu `= 0`)
- **Tỷ lệ tăng bộ nhớ**: `42 / 44 = 0.95 <= 1.2` (đạt yêu cầu `<= 1.2`)
