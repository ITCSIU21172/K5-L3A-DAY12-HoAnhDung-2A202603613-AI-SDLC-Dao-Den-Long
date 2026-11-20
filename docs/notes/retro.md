# Báo Cáo Đánh Giá & Tổng Kết (Retrospective)

Dự án: **Đảo Đèn Lồng (Lantern Island)**
Tác giả: Hồ Anh Dũng (MSSV: 03613)

---

## 1. Đánh giá kết quả đạt được
- **Đúng yêu cầu**:
  - Triển khai đầy đủ nhân vật Mây đội nón lá với đèn lồng nhỏ.
  - Đảo Bến hình tròn với 5 Đèn Lồng Lớn.
  - Cơ chế di chuyển 3D, thu thập đom đóm, nạp vào đèn lồng, quái vật Bóng Mực đuổi và kỹ năng Tỏa Sáng làm choáng.
  - Tuân thủ 100% Test Contract v1.0, chạy headless siêu nhanh (<0.1s cho 180 tick), không phụ thuộc GPU/canvas.
- **Tính tất định (Determinism)**:
  - Sử dụng thuật toán sinh số giả ngẫu nhiên Mulberry32 với seed xác định. Hai lần chạy cùng tham số cho ra mã băm SHA256 trùng khớp từng byte.
- **Harness AI**:
  - `AGENTS.md` súc tích, kỹ năng `verification.md` rõ ràng, bộ test 24 assertions bảo vệ toàn diện các ca kiểm thử.

## 2. Bài học rút ra khi cộng tác cùng AI trong SDLC
1. **Kiểm chứng độc lập là chìa khóa**: Không bao giờ tin vào lời khẳng định "mã nguồn đã chạy tốt" của AI. Việc xây dựng kịch bản kiểm thử (scenarios) và bộ test tự động trước khi viết tính năng giúp phát hiện lỗi sai lệch logic ngay tức thì.
2. **Kiến trúc tách rời (Headless Core vs Render Client)**: Việc tách logic game thành một engine toán học độc lập (`src/core/`) không chỉ đáp ứng hoàn hảo Test Contract mà còn giúp việc tích hợp vào đồ họa Three.js trở nên cực kỳ trơn tru và dễ bảo trì.
3. **Tiết kiệm token qua quy trình chuẩn**: Đọc kỹ tài liệu yêu cầu một lần, phân tích ranh giới rõ ràng, và lập kế hoạch chi tiết giúp giảm thiểu tối đa số lần trao đổi qua lại vô ích với mô hình.
