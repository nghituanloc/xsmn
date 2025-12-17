# XSMN – Kết quả xổ số miền Nam

Ứng dụng web tĩnh hiển thị kết quả xổ số miền Nam theo ngày, tối ưu cho di động và hỗ trợ PWA (có thể cài như app).

## Tính năng chính
- Chọn ngày để xem kết quả từng tỉnh theo lịch quay.
- Tải thêm tự động khi cuộn (về các ngày trước).
- Cập nhật realtime trong khung giờ quay (16:15–16:40).
- PWA: có thể “Cài ứng dụng” trên Android (Chrome/Edge) và iOS (Safari).
- Nút chuyển ngày chặn xem trước giờ quay để tránh dữ liệu sai.

## Cách chạy cục bộ
1) Yêu cầu: Node không bắt buộc; chỉ cần trình duyệt.  
2) Dùng máy chủ tĩnh (khuyến nghị) để bật PWA:
   - Với `serve`: `npx serve .`
   - Hoặc VS Code Live Server / bất kỳ HTTP server nào.
3) Mở trình duyệt tại địa chỉ máy chủ (mặc định `http://localhost:3000` hoặc `http://localhost:5000` tùy công cụ).

> Lưu ý: PWA cần chạy qua HTTP(S) (không phải `file://`). Trên mobile nên dùng HTTPS khi triển khai thật.

## Cài như ứng dụng (PWA)
- Android (Chrome/Edge): mở trang, nếu đủ điều kiện sẽ thấy nút “Cài ứng dụng” hoặc banner PWA.
- iOS (Safari): bấm “Chia sẻ” → “Thêm vào MH chính”. iOS không hiện popup tự động.
- Không hỗ trợ in-app browser (Facebook, Zalo…) và chế độ ẩn danh.

## Triển khai
Site thuần tĩnh, có thể host trên bất kỳ static hosting nào (GitHub Pages, Cloudflare Pages, Vercel static…). Đảm bảo các file sau được phục vụ:
- `index.html`
- `manifest.webmanifest`
- `service-worker.js`
- Thư mục `icons/`

## Lưu ý dữ liệu
- Trước 16:15, nếu chọn “hôm nay” sẽ tự chuyển sang “hôm qua” để tránh hiển thị sai (API có thể trả về dữ liệu cũ/tuần trước).
- Realtime chỉ chạy từ 16:15–16:40; sau đó chuyển sang tải kết quả đầy đủ định kỳ.

## Thử nhanh
- Mở `index.html` qua máy chủ tĩnh, chọn ngày hôm nay sau 16:15 để xem realtime.  
- Cuộn xuống cuối trang để tự tải thêm ngày trước.  
- Thử nút “Cài ứng dụng” khi đủ điều kiện PWA.