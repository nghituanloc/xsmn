# XSMN – Kết quả xổ số miền Nam

Ứng dụng web tĩnh hiển thị kết quả xổ số miền Nam theo ngày, tối ưu cho di động/tablet. Chạy trực tiếp trên trình duyệt, không cần bước build.

## Tính năng chính

- Chọn ngày để xem kết quả từng tỉnh theo lịch quay (bảng ngang, chữ lớn).
- Tải thêm tự động khi cuộn (về các ngày trước).
- Cập nhật realtime trong khung giờ quay (16:15–16:40).
- Nút chuyển ngày chặn xem trước giờ quay để tránh dữ liệu sai.

## Chạy cục bộ

Không cần cài đặt gì, chỉ cần một máy chủ tĩnh (vì dùng ES module và Service Worker, không mở trực tiếp `file://`).

```bash
# Python
python -m http.server 8000

# hoặc Node
npx serve .
```

Mở `http://localhost:8000`.

## Triển khai GitHub Pages

Push lên nhánh `main` — workflow Actions sẽ deploy toàn bộ thư mục gốc lên GitHub Pages. Không có bước build.

## Cấu trúc

- `index.html` — trang chính, nạp CSS, font (Google Fonts) và jQuery (CDN).
- `src/js/` — mã nguồn (ES module, import tương đối).
- `src/styles/` — CSS.
- `manifest.webmanifest`, `service-worker.js`, `icons/` — cấu hình PWA.

## Lưu ý dữ liệu

- Trước 16:15, nếu chọn “hôm nay” sẽ tự chuyển sang “hôm qua” để tránh hiển thị sai.
- Realtime chỉ chạy từ 16:15–16:40; sau đó chuyển sang tải kết quả đầy đủ định kỳ.
