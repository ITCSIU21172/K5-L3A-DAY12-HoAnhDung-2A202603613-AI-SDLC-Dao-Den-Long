# Video Demo Hướng Dẫn (Phase 4 - Release v1.0.0)

Học viên quay video màn hình `.mp4` dưới 5 phút thể hiện:

1. **Trải nghiệm chơi trực tiếp game 3D Đảo Đèn Lồng trên trình duyệt** (`npm start` -> `http://localhost:3000`):
   - Di chuyển nhân vật Mây (hoạt họa bước chân, tay vung nhịp nhàng), nhặt đom đóm, thắp đèn, lướt (Shift), tỏa sáng (Q).
   - Dùng phím `F2` hoặc phím số [1-8] demo nhanh các tính năng: Đầy đom đóm (1), Thắp đầy đèn & dầu (2), Chuyển nhanh Đêm 1 / Đêm 2 (cầu tre & bục nhảy) / Đêm 3 (Đảo Chuông phẳng & Tháp Chuông).
   - Chiêm ngưỡng hoạt cảnh **Bình Minh 3D** (phím 8 hoặc thắng Đêm).
   - Bảng xếp hạng (Leaderboard) & Cài đặt trợ năng (Accessibility).
2. **Chạy bộ kiểm thử tự động `npm test`**:
   - Chứng minh toàn bộ **79/79 test assertions** đạt kết quả PASSED (100%).
3. **Chạy lệnh headless CLI theo Test Contract v1.3 và kiểm tra output JSONL**:
   - `node src/headless.js --seed 42 --night 1 --ticks 120 --out demo_snap.jsonl`
   - Mở xem nội dung file `demo_snap.jsonl` chuẩn Contract.
4. **Lướt qua lịch sử commit git, các tag và file harness `AGENTS.md`**:
   - Chạy lệnh `git log --oneline --decorate -n 6` thể hiện các commit và các tag: `phase-1`, `phase-2`, `phase-3`, `phase-4`, `v1.0.0`.
   - Mở file `AGENTS.md` thể hiện quy trình AI SDLC.

Lưu video tại `docs/demo/demo.mp4` (dưới 100MB) hoặc đính kèm vào GitHub Release `v1.0.0`.
