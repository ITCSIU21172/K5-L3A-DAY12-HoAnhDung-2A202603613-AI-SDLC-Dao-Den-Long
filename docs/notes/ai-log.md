# Nhật Ký Dùng AI & Quản Lý Token (AI Log)

Dự án: **Đảo Đèn Lồng (Lantern Island)**
Tác giả: Hồ Anh Dũng (MSSV: 03613)

---

## 1. Chiến Lược Quản Lý Token & Tối Ưu Chi Phí
- **Nguyên tắc "Think & Plan Before Code"**:
  - Không để AI viết code ngay lập tức. Xác định rõ ràng Test Contract v1.0 (Phase 1) và v1.1 (Phase 2), các cấu trúc dữ liệu, và các trường hợp biên trước khi lập trình.
  - Tách bạch rõ logic headless (`src/core/`) và 3D rendering (`src/client/`).
- **Giữ ngữ cảnh gọn gàng**:
  - `AGENTS.md` được viết ngắn gọn (~35 dòng) chứa chính xác các lệnh build, test, run và nguyên tắc bất di bất dịch.
  - Sử dụng subagent browser để bóc tách thông tin từ link lab board chỉ trong 1 phiên duyệt, tránh việc tải lại toàn bộ trang nhiều lần.
- **Ước tính token sử dụng theo Phase**:
  - **Phase 1**:
    - Input tokens: ~35,000 tokens (trích xuất PRD-0 và Test Contract v1.0).
    - Output tokens: ~6,500 tokens (logic, Three.js client, test suite và tài liệu).
    - Chi phí ước tính: ~$0.015 USD.
  - **Phase 2 (Ticket-02)**:
    - Input tokens: ~45,000 tokens (phân tích Ticket-02 "Ba hòn đảo" và Test Contract v1.1).
    - Output tokens: ~12,000 tokens (mở rộng 3 Nights, cơ chế Lướt/Nhảy/Bục nhảy/Bùa Gió/Gió Lạc, cập nhật headless v1.1, 39 tests, HUD hoàn chỉnh).
    - Chi phí ước tính: ~$0.025 USD.
    - Tiết kiệm: Thiết kế kiến trúc module hóa từ Phase 1 giúp Phase 2 mở rộng trực tiếp mà không phải viết lại engine, giữ 100% tính hồi quy (regression) và không phát sinh chi phí gỡ lỗi lặp đi lặp lại.

---

## 2. Các Sai Sót Của AI & Cách Khắc Phục (AI Failure Analysis)
1. **Lỗi socket loopback trong Windows Sandbox (Phase 1)**:
   - *Triệu chứng*: Khi thử kiểm tra web server bằng lệnh PowerShell trong sandbox, sandbox của Windows chặn mở kết nối socket cục bộ.
   - *Khắc phục*: Tách riêng quy trình kiểm thử headless logic và hướng dẫn người dùng chạy server bằng `npm start` ở môi trường ngoài sandbox.
2. **Quy định mã lỗi của Test Contract**:
   - *Triệu chứng*: Agent ban đầu có xu hướng để mã lỗi là `1` cho mọi trường hợp.
   - *Khắc phục*: Đối chiếu với Test Contract v1.0 và v1.1 quy định nghiêm ngặt: file inputs/scenario sai định dạng phải thoát với mã `2`. Đã cập nhật `src/headless.js` để bắt lỗi JSON schema và thoát đúng mã `2`.
3. **Thứ tự xử lý 12 bước trong 1 tick (Phase 2)**:
   - *Triệu chứng*: Khi triển khai các thực thể mới (Bùa Gió, Gió Lạc), agent có thể nhặt đom đóm trước khi di chuyển hoặc xét contact trước khi cập nhật safe zone.
   - *Khắc phục*: Chuẩn hóa hàm `Simulation.step()` tuân thủ nghiêm ngặt theo 12 bước quy định trong Ticket-02 (Input -> Counters -> Move -> Pick -> Interact -> Safe zone -> Pulse -> Move Enemies -> Contacts -> Spawn -> Win/Loss -> Snapshot).
