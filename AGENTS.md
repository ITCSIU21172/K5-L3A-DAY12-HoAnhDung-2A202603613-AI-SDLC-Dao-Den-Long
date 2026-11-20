# AGENTS.md - Harness Chỉ Dẫn Cho Agent

Dự án: **Đảo Đèn Lồng (Lantern Island)** - Game 3D theo quy trình AI SDLC.

## Lệnh cốt lõi
- Cài đặt: `npm install`
- Chạy giao diện 3D: `npm start` (mở trình duyệt tại `http://localhost:3000`)
- Chạy kiểm thử tự động & scenario: `npm test`
- Chạy chế độ headless: `node src/headless.js --seed <int> --night 1 --ticks <int> --out <file.jsonl>`

## Quy ước kiến trúc & SDLC
1. **Phân tách Logic và Hiển thị**:
   - `src/core/`: Mã nguồn logic mô phỏng thuần túy (không phụ thuộc DOM, canvas hay GPU), chạy ở tần số cố định 60 ticks/s, tất định 100% qua PRNG.
   - `src/client/`: Giao diện 3D Three.js và âm thanh Web Audio API, kết nối và đồng bộ trực tiếp với `src/core/simulation.js`.
2. **Test Contract v1.0**:
   - Mọi thay đổi trong logic phải tuân thủ nghiêm ngặt schema và thông số trong `game.contract.json`.
   - File scenario/inputs không hợp lệ bắt buộc thoát với mã lỗi `2`.
   - Cùng seed + scenario + inputs bắt buộc sinh ra output JSONL giống nhau byte-for-byte.
3. **Quy tắc Kiểm Chứng**:
   - Không được sửa tay kết quả kiểm thử hoặc viết test luôn luôn passed.
   - Khi có tính năng hoặc yêu cầu mới: viết scenario kiểm chứng trước, chạy test đỏ, code tính năng, chạy test xanh.
   - Luôn chạy `npm test` để xác minh hồi quy trước khi commit.
