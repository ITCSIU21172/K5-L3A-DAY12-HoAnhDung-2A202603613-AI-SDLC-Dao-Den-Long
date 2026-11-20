# Nhật Ký Dùng AI & Quản Lý Token (AI Log)

Dự án: **Đảo Đèn Lồng (Lantern Island)**
Tác giả: Hồ Anh Dũng (MSSV: 03613)

---

## 1. Chiến lược quản lý token & tối ưu chi phí
- **Nguyên tắc "Think & Plan Before Code"**:
  - Không để AI viết code ngay lập tức. Xác định rõ ràng Test Contract v1.0, các cấu trúc dữ liệu, và các trường hợp biên trước khi lập trình.
  - Tách bạch rõ logic headless (`src/core/`) và 3D rendering (`src/client/`).
- **Giữ ngữ cảnh gọn gàng**:
  - `AGENTS.md` được viết ngắn gọn (~30 dòng) chứa chính xác các lệnh build, test, run và nguyên tắc bất di bất dịch.
  - Sử dụng subagent browser để bóc tách thông tin từ link lab board chỉ trong 1 phiên duyệt, tránh việc tải lại toàn bộ trang nhiều lần.
- **Ước tính token sử dụng theo Phase**:
  - **Phase 1**:
    - Input tokens: ~35,000 tokens (chủ yếu là trích xuất PRD-0 và Test Contract v1.0 từ artifact).
    - Output tokens: ~6,500 tokens (tạo mã nguồn logic, CLI runner, Three.js client, test suite và tài liệu).
    - Chi phí ước tính: ~$0.015 USD.
    - Tiết kiệm: Việc chia module và viết test kịch bản tự động giúp không phải debug lặp đi lặp lại qua LLM, giảm 70% số token phát sinh do sửa lỗi.

---

## 2. Các sai sót của AI & Cách khắc phục (AI Failure Analysis)
1. **Lỗi socket loopback trong Windows Sandbox**:
   - *Triệu chứng*: Khi thử kiểm tra web server bằng lệnh PowerShell trong sandbox, sandbox của Windows chặn mở kết nối socket cục bộ (`An attempt was made to access a socket in a way forbidden by its access permissions`).
   - *Khắc phục*: Tách riêng quy trình kiểm thử headless logic (chạy hoàn toàn trong sandbox bằng node CLI thuần túy, không cần socket) và hướng dẫn người dùng chạy server bằng `npm start` ở môi trường ngoài sandbox (`BypassSandbox: true` hoặc chạy trực tiếp trên terminal của máy người dùng).
2. **Quy định mã lỗi của Test Contract**:
   - *Triệu chứng*: Agent ban đầu có xu hướng để mã lỗi là `1` cho mọi trường hợp.
   - *Khắc phục*: Đối chiếu với Test Contract v1.0 quy định nghiêm ngặt: file inputs/scenario sai định dạng phải thoát với mã `2`. Đã cập nhật `src/headless.js` để bắt lỗi JSON schema và thoát đúng mã `2`.
