# IoT Hub

Frontend nhà thông minh sử dụng React 18, Vite 6 và Bootstrap 5.
Giao diện tiếng Việt, chuyển trang bằng URL hash; icon và biểu đồ được vẽ bằng SVG.

## Chạy dự án

Sử dụng Node.js 22.12+ hoặc Node.js 24, chạy tại thư mục chứa `package.json`:

```bash
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal. Không mở `index.html` bằng Live Server.

```bash
npm run build        # Tạo bản build trong dist/
npm run preview      # Xem bản build
npm run format       # Format mã nguồn và tài liệu
npm run format:check # Kiểm tra định dạng
```

## Cấu trúc

```text
src/
  components/       # Icon, phân trang, bảng cuộn, biểu đồ SVG
  constants/        # Nhãn tiếng Việt cho cảm biến, thiết bị, trạng thái
  data/             # Dữ liệu mẫu cho bảng và biểu đồ
  pages/            # Dashboard, DataSensor, History, Profile
  utils/            # Tìm kiếm, sắp xếp, phân trang và định dạng cảm biến
  App.jsx           # Sidebar, header và chuyển trang
  main.jsx          # Khởi tạo React, import Bootstrap và CSS
  styles.css        # Giao diện chung, responsive và hiệu ứng
```

`node_modules/` chứa các thư viện đã cài; `dist/` được tạo lại khi build.
Cả hai được bỏ qua bởi Git và Prettier.

## Chức năng hiện tại

- **Tổng quan:** thẻ số liệu, thanh gradient, biểu đồ SVG và công tắc thiết bị.
  Bật quạt có hiệu ứng xoay, đèn phát sáng, điều hòa có luồng gió.
- **Dữ liệu cảm biến:** tìm theo tiêu chí và nội dung, sắp xếp thời gian giảm dần,
  mặc định 20 bản ghi/trang. Nhấn Tìm kiếm hoặc Enter để áp dụng.
- **Lịch sử:** tìm theo thời gian, lọc thiết bị, thao tác và trạng thái;
  mặc định 4 bản ghi/trang. Bộ lọc áp dụng ngay khi thay đổi.
- **Bảng:** tiêu đề cố định, vùng dữ liệu cuộn riêng và phân trang bên dưới.
- **Hồ sơ:** thông tin liên hệ và các thẻ tài liệu. Các thẻ chưa có URL được
  hiển thị với ghi chú “Chưa có liên kết”. Avatar sử dụng chữ viết tắt BL.

## Dữ liệu và tích hợp

Đây là frontend demo, chưa kết nối API, MQTT hoặc WebSocket.
Các công tắc chỉ cập nhật trạng thái React, giữ trạng thái khi chuyển trang
nhưng mất khi tải lại; chưa điều khiển phần cứng hay ghi thêm lịch sử.

`SensorChart.jsx` tính tọa độ từ các mảng trong `data/dashboard.js`, sau đó
vẽ đường, điểm, trục và vùng tô bằng SVG. Không sử dụng ảnh biểu đồ.
Số liệu trên thẻ Tổng quan và các mảng biểu đồ vẫn là dữ liệu mẫu riêng.

`utils/sensorSearch.js` tạo `pageRequest` và `searchRequest`, hiện áp dụng
trên dữ liệu mẫu trong `data/mockData.js`. Đây là phần có thể nối với API sau này.
# SmartHome-Frontend
