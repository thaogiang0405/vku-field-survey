# Thiết lập dữ liệu dùng chung

Ứng dụng vẫn lưu bản sao cục bộ trong IndexedDB để dùng khi ngoại tuyến. Máy chủ API là nguồn dữ liệu dùng chung: mỗi lần ứng dụng trực tuyến, hệ thống sẽ đẩy các phiếu đang chờ rồi tải danh sách mới nhất từ máy chủ về thiết bị.

## Chạy cục bộ

1. Sao chép `.env.example` thành `.env` và giữ `VITE_API_URL=http://localhost:3000`.
2. Chạy API: `npm run server`.
3. Ở một cửa sổ khác, chạy PWA: `npm run dev`.

API lưu dữ liệu tại `data/inspections.json`; dữ liệu này tồn tại qua lần khởi động lại API và không được commit Git.

## Triển khai

Triển khai API ở URL HTTPS công khai và đặt `VITE_API_URL` của frontend thành URL gốc đó (không thêm `/api`). Cần đặt biến `DATA_FILE` trỏ vào persistent volume của dịch vụ backend; không dùng filesystem tạm của serverless. Frontend có thể tiếp tục deploy lên Cloudflare, miễn API cho phép CORS từ domain frontend.

## Kiểm tra nhanh

`GET /api/health` trả trạng thái và số phiếu. Gửi lại cùng một `id` tới `POST /api/inspections` là idempotent: chỉ một bản ghi được lưu.
