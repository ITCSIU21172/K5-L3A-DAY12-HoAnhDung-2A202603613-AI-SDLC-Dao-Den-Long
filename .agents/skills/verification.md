# Skill: Quy Trình Kiểm Chứng Tự Động (Verification - Phase 2)

Mục đích: Hướng dẫn agent và người chấm thực hiện kiểm chứng toàn diện tính đúng đắn của game theo Test Contract v1.1 và Ticket-02.

## 1. Kiểm tra tính tất định (Determinism v1.1)
Chạy cùng một seed trên Đêm 2 và so sánh mã băm SHA256:
```bash
node src/headless.js --seed 7777 --night 2 --ticks 240 --out run1.jsonl
node src/headless.js --seed 7777 --night 2 --ticks 240 --out run2.jsonl
```
Xác nhận 2 file khớp nhau từng byte:
```bash
# Windows PowerShell:
(Get-FileHash run1.jsonl).Hash -eq (Get-FileHash run2.jsonl).Hash
```

## 2. Kiểm tra các scenario mẫu Phase 2
- **Cơ chế Lướt (Dash)**:
  `node src/headless.js --seed 42 --night 1 --scenario tests/scenarios/scenario_dash.json --inputs tests/scenarios/inputs_dash.json --ticks 20 --out tests/out_dash.jsonl`
- **Bùa Gió (Charm)**:
  `node src/headless.js --seed 42 --night 2 --scenario tests/scenarios/scenario_charm.json --inputs tests/scenarios/inputs_charm.json --ticks 20 --out tests/out_charm.jsonl`
- **Gió Lạc cướp đom đóm (Drifter Steal)**:
  `node src/headless.js --seed 42 --night 2 --scenario tests/scenarios/scenario_drifter.json --ticks 10 --out tests/out_drifter.jsonl`
- **Tạm dừng (Pause)**:
  `node src/headless.js --seed 42 --night 1 --scenario tests/scenarios/scenario_pause.json --inputs tests/scenarios/inputs_pause.json --ticks 20 --out tests/out_pause.jsonl`
- **Chạy cả 3 Đêm**:
  `node src/headless.js --seed 42 --night 1 --ticks 60 --out tests/out_n1.jsonl`
  `node src/headless.js --seed 42 --night 2 --ticks 60 --out tests/out_n2.jsonl`
  `node src/headless.js --seed 42 --night 3 --ticks 60 --out tests/out_n3.jsonl`

## 3. Chạy toàn bộ bộ kiểm thử tự động
```bash
npm test
```
Toàn bộ 39 test assertions sẽ hoàn thành trong < 1 giây.
