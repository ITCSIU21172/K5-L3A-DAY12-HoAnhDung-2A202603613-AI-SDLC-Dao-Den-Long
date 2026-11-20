# Skill: Quy Trình Kiểm Chứng Tự Động (Verification)

Mục đích: Hướng dẫn agent và người chấm thực hiện kiểm chứng toàn diện tính đúng đắn của game theo Test Contract v1.0 và PRD-0.

## 1. Kiểm tra tính tất định (Determinism)
Chạy cùng một seed và so sánh mã băm SHA256:
```bash
node src/headless.js --seed 98765 --night 1 --ticks 180 --out run1.jsonl
node src/headless.js --seed 98765 --night 1 --ticks 180 --out run2.jsonl
```
Xác nhận 2 file khớp nhau từng byte:
```bash
# Linux/macOS:
diff run1.jsonl run2.jsonl
# Windows PowerShell:
(Get-FileHash run1.jsonl).Hash -eq (Get-FileHash run2.jsonl).Hash
```

## 2. Kiểm tra các scenario mẫu
- **Thu thập đom đóm**:
  `node src/headless.js --seed 42 --night 1 --scenario tests/scenarios/scenario_pickup.json --inputs tests/scenarios/inputs_pickup.json --ticks 25 --out tests/out_pickup.jsonl`
- **Nạp đom đóm & Thắp đèn**:
  `node src/headless.js --seed 42 --night 1 --scenario tests/scenarios/scenario_deposit.json --inputs tests/scenarios/inputs_deposit.json --ticks 10 --out tests/out_deposit.jsonl`
- **Tỏa sáng (Pulse) làm choáng Bóng Mực**:
  `node src/headless.js --seed 42 --night 1 --scenario tests/scenarios/scenario_pulse.json --inputs tests/scenarios/inputs_pulse.json --ticks 10 --out tests/out_pulse.jsonl`
- **Bóng mực tấn công (Player Hit)**:
  `node src/headless.js --seed 42 --night 1 --scenario tests/scenarios/scenario_shade_hit.json --ticks 5 --out tests/out_shade_hit.jsonl`
- **Chiến thắng (Thắp đủ 5 đèn)**:
  `node src/headless.js --seed 42 --night 1 --scenario tests/scenarios/scenario_win.json --inputs tests/scenarios/inputs_win.json --ticks 10 --out tests/out_win.jsonl`

## 3. Chạy toàn bộ bộ kiểm thử tự động
```bash
npm test
```
Toàn bộ 24 test assertions sẽ hoàn thành trong < 1 giây.
