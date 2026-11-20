# AGENTS.md - Harness Chỉ Dẫn Cho Agent (Phase 2 - Contract v1.1)

Dự án: **Đảo Đèn Lồng (Lantern Island)** - Game 3D theo quy trình AI SDLC.

## Lệnh cốt lõi
- Cài đặt: `npm install`
- Chạy giao diện 3D: `npm start` (mở trình duyệt tại `http://localhost:3000`)
- Chạy kiểm thử tự động & scenario: `npm test`
- Chạy chế độ headless: `node src/headless.js --seed <int> --night <1|2|3> --ticks <int> --out <file.jsonl>`

## Quy ước kiến trúc & SDLC (Contract v1.1)
1. **Phân tách Logic và Hiển thị**:
   - `src/core/`: Mã nguồn logic mô phỏng thuần túy (không phụ thuộc DOM, canvas hay GPU), chạy ở tần số cố định 60 ticks/s, tất định 100% qua PRNG. Hỗ trợ 3 Đêm (Đảo Bến, Đảo Cau, Đảo Chuông).
   - `src/client/`: Giao diện 3D Three.js và âm thanh Web Audio API, kết nối và đồng bộ trực tiếp với `src/core/simulation.js`.
2. **Test Contract v1.1 & Thứ tự 12 bước trong tick**:
   - Mọi thay đổi trong logic phải tuân thủ nghiêm ngặt schema và thông số trong `game.contract.json`.
   - Thứ tự xử lý tick: Input -> Counters -> Move Mây (jump/dash/pads/wind/fall) -> Pick (motes/charms) -> Interact đèn -> Safe zones -> Pulse -> Move enemies -> Contacts (Drifter steal, Shade hit) -> Spawn -> Win/loss -> Snapshot.
   - File scenario/inputs không hợp lệ bắt buộc thoát với mã lỗi `2`.
   - Cùng seed + scenario + inputs bắt buộc sinh ra output JSONL giống nhau byte-for-byte.
3. **Quy tắc Kiểm Chứng**:
   - Không được sửa tay kết quả kiểm thử hoặc viết test luôn luôn passed.
   - Luôn chạy `npm test` (39 assertions) để xác minh hồi quy trước khi commit.
