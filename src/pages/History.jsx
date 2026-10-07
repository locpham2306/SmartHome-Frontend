// FILE NÀY TẠO MÀN "LỊCH SỬ".
// Phần trên return chọn các dòng cần hiện; phần trong return vẽ ô lọc, bảng và nút trang.
// Khác màn Dữ liệu: chọn bộ lọc hoặc gõ thời gian là bảng đổi ngay, không cần bấm Tìm kiếm.
//
// Các bước khi mở màn:
// 1. Đọc historyRows cố định; mỗi dòng có id, time, user, device, action, status.
// 2. Ô thời gian và ba dropdown cập nhật state ngay, không có bước bấm Tìm kiếm.
// 3. Lọc theo tất cả điều kiện cùng lúc → sắp xếp thời gian giảm dần → cắt trang.
// 4. Vẽ sáu cột; các badge biểu thị thao tác và kết quả độc lập (Bật vẫn có thể Thất bại).
// 5. Pagination nhận tổng sau lọc để hiển thị đúng số trang. Dữ liệu hiện chưa lấy từ server.
import { deviceLabels, statusLabels } from '../constants/labels';
import React, { useState } from 'react';
import { historyRows } from '../data/mockData';
import Pagination from '../components/Pagination';
import Icon from '../components/Icon';
import ScrollableTable from '../components/ScrollableTable';
import FilterSelect from '../components/FilterSelect';

// Màn lịch sử đọc dữ liệu mẫu cố định; không tự thêm bản ghi khi bật/tắt ở Tổng quan.
export default function History() {
  // useState là cách React nhớ giá trị đang chọn.
  // Ví dụ [device, setDevice]: đọc device để biết đang lọc thiết bị nào; gọi setDevice để đổi thiết bị.
  // Khi gọi một hàm set..., React chạy lại History, lọc lại danh sách rồi cập nhật bảng.
  // Nội dung ô tìm thời gian. Chuỗi rỗng khớp mọi bản ghi vì includes('') luôn true.
  const [query, setQuery] = useState('');
  // Mã thiết bị đang lọc, ví dụ Fan/AC/Light System; all bỏ điều kiện thiết bị.
  const [device, setDevice] = useState('all');
  // Thao tác đang lọc: ON hoặc OFF; all cho phép cả hai.
  const [action, setAction] = useState('all');
  // Kết quả đang lọc: Success hoặc Failed; all không giới hạn kết quả.
  const [status, setStatus] = useState('all');
  // Số dòng/trang, mặc định 20; độc lập với tổng số bản ghi sau lọc.
  const [size, setSize] = useState(20);
  // Trang đang xem bắt đầu từ 1; đổi bất kỳ bộ lọc nào cũng reset về 1.
  const [page, setPage] = useState(1);

  // Tạo các mục trong ô chọn thiết bị từ dữ liệu có sẵn.
  const devices = [...new Set(historyRows.map((row) => row.device))];
  // Chấp nhận thời gian có chữ T kiểu ISO hoặc dấu cách như nội dung đang hiển thị.
  const timeQuery = query
    .trim()
    // Chỉ thay t/T nằm giữa hai chữ số, giữ lại chữ số đầu nhờ nhóm $1.
    .replace(/(\d)t(?=\d)/gi, '$1 ')
    .toLowerCase();
  // rows là danh sách tìm được, chưa chia trang. filter kiểm tra lần lượt từng bản ghi row.
  const rows = historyRows
    .filter(
      (row) =>
        // Nếu chọn Tất cả (all) HOẶC thiết bị của dòng đúng với thiết bị đang chọn thì qua điều kiện này.
        (device === 'all' || row.device === device) &&
        (action === 'all' || row.action === action) &&
        (status === 'all' || row.status === status) &&
        // kiểm tra chuỗi đó có chứa nội dung tìm không.
        row.time.replace('T', ' ').toLowerCase().includes(timeQuery),
    )
    .sort((a, b) => b.time.localeCompare(a.time) || b.id - a.id);
  // Bảng chỉ hiện một phần của rows. Phần đang được xem gọi là visibleRows.
  const visibleRows = rows.slice((page - 1) * size, page * size);

  return (
    <div className="history-page">
      {/* Ô tìm thời gian và ba dropdown: thiết bị, thao tác, kết quả thực thi. */}
      <div className="sensor-toolbar history-toolbar">
        {/* Ô tìm trong thời gian */}
        <div className="sensor-input-wrap history-search">
          <Icon name="search" />
          <input
            className="form-control search-input"
            aria-label="Tìm theo thời gian"
            placeholder="Tìm theo thời gian..."
            value={query}
            onChange={(event) => {
              // Lấy chữ vừa gõ vào ô thời gian. query đổi → tính lại rows → bảng đổi ngay.
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        </div>
        {/* lọc thiết bị */}
        <FilterSelect
          label="Lọc theo thiết bị"
          value={device}
          options={[
            { value: 'all', label: 'Tất cả thiết bị' },
            ...devices.map((name) => ({
              value: name,
              label: deviceLabels[name] || name,
            })),
          ]}
          onChange={(value) => {
            setDevice(value);
            setPage(1);
          }}
        />
        {/* lọc thao tác */}
        <FilterSelect
          label="Lọc theo thao tác"
          value={action}
          options={[
            { value: 'all', label: 'Tất cả thao tác' },
            { value: 'ON', label: 'Bật' },
            { value: 'OFF', label: 'Tắt' },
          ]}
          onChange={(value) => {
            setAction(value);
            setPage(1);
          }}
        />
        {/* lọc trạng thái */}
        <FilterSelect
          label="Lọc theo trạng thái"
          value={status}
          options={[
            { value: 'all', label: 'Tất cả trạng thái' },
            { value: 'Success', label: 'Thành công' },
            { value: 'Failed', label: 'Thất bại' },
          ]}
          onChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        />
      </div>
      <section
        className="panel sensor-table-panel history-table-panel"
        aria-label="Lịch sử thiết bị"
      >
        {/* tạo bảng 6 cột */}
        <ScrollableTable
          className="table history-table align-middle mb-0"
          columns={[8, 22, 22, 19, 13, 16]}
        >
          {/* Tỉ lệ cột theo thứ tự: Mã 8%, Thời gian 22%, Người điều khiển 22%, Thiết bị 19%, Thao tác 13%, Trạng thái 16%.
              Mảng nhãn tạo sáu th bằng map; scope=col giúp liên kết tiêu đề với nội dung cột. */}
          <thead>
            <tr>
              {[
                'MÃ',
                'THỜI GIAN',
                'NGƯỜI ĐIỀU KHIỂN',
                'THIẾT BỊ',
                'THAO TÁC',
                'TRẠNG THÁI',
              ].map((label) => (
                <th scope="col" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody tabIndex={0} aria-label="Các bản ghi lịch sử">
            {/* Badge thao tác và kết quả có màu riêng; nhãn tiếng Việt lấy từ constants/labels. */}
            {/* tạo nội dung bằng map */}
            {visibleRows.map((row) => (
              <tr key={row.id}>
                {/* key={row.id} nhận diện dòng trong React; fw-semibold làm mã hơi đậm, text-nowrap giữ thời gian trên một dòng. */}
                <td className="fw-semibold">{row.id}</td>
                <td className="text-nowrap">{row.time.replace('T', ' ')}</td>
                {/* Nếu user rỗng/null/undefined thì dùng Chưa xác định; CSS cho phép tên dài ngắt dòng. */}
                <td className="history-operator">
                  {row.user || 'Chưa xác định'}
                </td>
                <td>
                  <span className="history-device" data-device={row.device}>
                    <span className="history-device-icon">
                      {/* Chọn hình quạt cho Fan, điều hòa cho AC; các mã còn lại ở dữ liệu mẫu dùng hình đèn. */}
                      <Icon
                        name={
                          row.device === 'Fan'
                            ? 'fan'
                            : row.device === 'AC'
                              ? 'ac'
                              : 'light'
                        }
                      />
                    </span>
                    {/* Tra nhãn tiếng Việt theo mã; nếu chưa có nhãn thì giữ mã gốc để ô không bị trống. */}
                    {deviceLabels[row.device] || row.device}
                  </span>
                </td>
                <td>
                  <span
                    className={
                      // Class ON tạo nền xanh, OFF tạo nền vàng; đổi màu không làm thay đổi row.action.
                      'history-action ' +
                      (row.action === 'ON' ? 'action-on' : 'action-off')
                    }
                  >
                    <Icon name="power" />
                    {row.action === 'ON' ? 'Bật' : 'Tắt'}
                  </span>
                </td>
                <td>
                  <span
                    className={
                      // Thành công: nền xanh lá/icon dấu tích; thất bại: nền hồng/icon dấu x.
                      'status-badge ' +
                      (row.status === 'Success' ? 'success' : 'failed')
                    }
                  >
                    <Icon name={row.status === 'Success' ? 'check' : 'close'} />
                    {statusLabels[row.status] || row.status}
                  </span>
                </td>
              </tr>
            ))}
            {/* Không có kết quả thì một ô colSpan=6 phủ toàn bộ cột; footer vẫn hiện 0–0 trên 0 bản ghi. */}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-secondary py-5">
                  Không có hoạt động phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </ScrollableTable>
        {/* Phân trang dựa trên toàn bộ rows đã lọc, không dùng độ dài visibleRows. */}
        <Pagination
          page={page}
          size={size}
          total={rows.length}
          // Chọn số trang chỉ thay page; toàn bộ bộ lọc đang chọn vẫn giữ nguyên.
          onChange={setPage}
          onSizeChange={(value) => {
            // Đổi số dòng rồi quay về trang đầu, tránh giữ page lớn hơn số trang mới.
            setSize(value);
            setPage(1);
          }}
        />
      </section>
    </div>
  );
}
