# AGENTS.md - Harness Chỉ Dẫn Cho Agent (Phase 4 - Contract v1.3)

Dự án: **Đảo Đèn Lồng (Lantern Island)** - Game 3D theo quy trình AI SDLC.

## Lệnh cốt lõi
- Cài đặt: `npm install`
- Chạy giao diện 3D: `npm start` (mở trình duyệt tại `http://localhost:3000`)
- Chạy kiểm thử tự động & regression: `npm test`
- Chạy chế độ headless: `node src/headless.js --seed <int> --night <1|2|3> [--scenario <file.json>] [--inputs <file.json>] --ticks <int> --out <file.jsonl>`
- Chạy đo hiệu năng (Benchmark): `node src/benchmark.js --seed 42 --duration 30 --out bench.json`
- Chạy ngâm tải (Soak test): `node --expose-gc src/soak.js --seed 7 --nights 10 --out soak.json`
- Xuất bảng xếp hạng (Leaderboard): `node src/headless.js --export-leaderboard out.json`

## Quy ước kiến trúc & SDLC (Contract v1.3)
1. **Phân tách Logic và Hiển thị**:
   - `src/core/`: Mã nguồn logic mô phỏng thuần túy (không phụ thuộc DOM, canvas hay GPU), chạy ở tần số cố định 60 ticks/s, tất định 100% qua PRNG. Hỗ trợ 3 Đêm (Đảo Bến, Đảo Cau, Đảo Chuông).
   - `src/client/`: Giao diện 3D Three.js và âm thanh Web Audio API, kết nối và đồng bộ trực tiếp với `src/core/simulation.js`.
2. **Test Contract v1.3 & Thứ tự 12 bước trong tick**:
   - Mọi thay đổi trong logic tuân thủ nghiêm ngặt schema và thông số trong `game.contract.json`.
   - Thứ tự xử lý tick:
     1. Input & Pause
     2. Counters & Fuel Reduction (tiêu hao tự nhiên 1.0/s, Bóng Mực drain 5.0/s; dập tắt đèn khi fuel <= 0)
     3. Move Mây (jump/dash/pads/wind/fall)
     4. Pick (motes/charms, sức chứa động 10..20)
     5. Interact (thắp mới: 10 motes / thắp lại: 5 motes / châm dầu)
     6. Safe zones (phục hồi khi fuel >= 30, đẩy bóng mực ra mép 6m trong 30 tick)
     7. Pulse (choáng bóng mực, ngắt drain +15 điểm)
     8. Move enemies (Bóng Mực ưu tiên tìm đèn fuel < 30 và chuyển sang drain khi <= 2m; Gió Lạc cướp đom đóm)
     9. Contacts (damage, rơi motes, recoil)
     10. Spawn (motes, Shades, Drifters)
     11. Win/loss check (hết ngọn lửa -> thua no_flames; hết giờ -> thắng dawn_survived nếu lit >= ceil(0.6*N))
     12. Snapshot (JSONL Contract v1.3).
   - File scenario/inputs không hợp lệ bắt buộc thoát với mã lỗi `2`.
   - Cùng seed + scenario + inputs bắt buộc sinh ra output JSONL giống nhau byte-for-byte.
3. **Quy tắc Kiểm Chứng**:
   - Không được sửa tay kết quả kiểm thử hoặc viết test luôn luôn passed.
   - Luôn chạy `npm test` (79 assertions) để xác minh hồi quy trước khi commit.
