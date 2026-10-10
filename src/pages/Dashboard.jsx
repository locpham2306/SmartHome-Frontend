import { deviceLabels } from '../constants/labels';
import React, { useEffect, useRef, useState } from 'react';
import Icon from '../components/Icon';
import SensorChart from '../components/SensorChart';
import SensorStats from '../components/SensorStats';

export default function Dashboard() {
  const [devices, setDevices] = useState({
    Fan: false,
    AC: false,
    Light: false,
  });
  // Hai biến phục vụ việc chờ 0,5 giây
  const [pendingDevices, setPendingDevices] = useState({});

  const deviceTimers = useRef({});
  const allDevicesOn = Object.values(devices).every(Boolean);
  const isDevicePending = Object.values(pendingDevices).some(Boolean);

  // bật tắt tất cả
  const toggleAllDevices = () => {
    if (Object.keys(deviceTimers.current).length > 0) return;
    const nextState = !allDevicesOn;
    Object.entries(devices).forEach(([name, on]) => {
      if (on !== nextState) toggleDevice(name);
    });
  };
  // Khi Dashboard bị tháo khỏi trang, hủy tất cả hẹn giờ còn đang chờ.
  useEffect(
    () => () => {
      Object.values(deviceTimers.current).forEach(clearTimeout);
    },
    [],
  );

  // Bấm công tắc → hiện Đang xử lý… → đợi nửa giây → đổi bật/tắt → cho bấm tiếp.
  // name là mã Fan/AC/Light. Mỗi mã có timer riêng nên có thể chờ bật quạt và đèn đồng thời.
  // Không đảo devices ngay khi bấm: icon và aria-checked giữ trạng thái đã hoàn tất đến khi hết 500 ms.
  // bấm công tắc thì chạy
  const toggleDevice = (name) => {
    // Ref được gán đồng bộ nên chặn cả hai lần bấm rất nhanh trước khi disabled kịp render.
    if (deviceTimers.current[name]) return;
    // đánh dấu quạt đang được xử lí
    setPendingDevices((previous) => ({ ...previous, [name]: true }));
    deviceTimers.current[name] = setTimeout(() => {
      // previous là trạng thái các thiết bị ngay trước lần đổi này.
      // ...previous chép lại tất cả; [name] chọn đúng thiết bị vừa bấm; ! đảo true thành false hoặc ngược lại.
      // Ví dụ name="Fan": chỉ đổi Quạt, còn Điều hòa và Đèn giữ nguyên.
      // đảo ngc thiết bị
      setDevices((previous) => ({ ...previous, [name]: !previous[name] }));
      // kết thúc trạng thái chờ
      setPendingDevices((previous) => ({ ...previous, [name]: false }));
      // Xóa khóa timer để lần bấm tiếp theo có thể tạo một yêu cầu mới cho cùng thiết bị.
      delete deviceTimers.current[name];
      // Đóng hàm hẹn giờ: 500 ở dưới là 500 mili giây = 0,5 giây.
    }, 500);
  };
  return (
    <section className="dashboard-panel" aria-label="Tổng quan nhà thông minh">
      <SensorStats />
      {/* Hai biểu đồ dùng chung SensorChart; lightOnly chọn thang đo lux thay vì nhiệt độ/độ ẩm. */}
      <div className="dashboard-body">
        {/* biểu đồ nhiệt độ độ ẩm */}
        <article className="chart-card">
          <div className="chart-heading">
            <h2>Nhiệt độ &amp; Độ ẩm</h2>
            <div className="chart-legend">
              <span>
                <i className="legend-temperature" />
                Nhiệt độ (°C)
              </span>
              <span>
                <i className="legend-humidity" />
                Độ ẩm (%)
              </span>
            </div>
          </div>
          {/* Không truyền lightOnly nên component vẽ đồng thời nhiệt độ và độ ẩm*/}
          <SensorChart />
        </article>
        {/* biểu đồ ánh sáng */}
        <article className="chart-card light-chart">
          <div className="chart-heading">
            <h2>Cường độ ánh sáng</h2>
            <div className="chart-legend">
              <span>
                <i className="legend-light" />
                Ánh sáng (lux)
              </span>
            </div>
          </div>
          {/* lightOnly tương đương lightOnly={true}, chọn mảng ánh sáng và thang lux. */}
          <SensorChart lightOnly />
        </article>

        {/* Công tắc và icon chỉ đổi trạng thái sau delay; mỗi thiết bị có thể xử lý độc lập. */}
        <article className="device-panel">
          <div className="device-heading">
            <h2>
              <Icon name="controls" />
              Điều khiển thiết bị
            </h2>
            <button
              type="button"
              className="device-toggle-all"
              disabled={isDevicePending}
              aria-busy={isDevicePending}
              // *bật tắt tất cả
              onClick={toggleAllDevices}
            >
              <Icon name="power" />

              {isDevicePending
                ? 'Đang xử lý…'
                : allDevicesOn
                  ? 'Tắt tất cả'
                  : 'Bật tất cả'}
            </button>
          </div>
          <div className="device-list">
            {/* tạo 3 hàng thiết bị*/}
            {Object.entries(devices).map(([name, on]) => (
              <div className="device-row" key={name}>
                <span
                  // cho quạt quay khi bật
                  className={
                    'device-icon device-' +
                    name.toLowerCase() +
                    (on ? ' is-on' : '')
                  }
                >
                  <Icon name={name.toLowerCase()} />
                  {/* tạo luồng gió chỉ dành cho điều hòa; CSS chạy animation khi có lớp is-on. */}
                  {name === 'AC' && (
                    <svg
                      className="device-airflow"
                      viewBox="0 0 28 10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M2 2h17q4 0 4-2" />
                      <path d="M5 5h19" />
                      <path d="M2 8h14q4 0 4 2" />
                    </svg>
                    // 3 path là 3 nét gió
                  )}
                </span>
                {/* role=status thông báo thay đổi nội dung cho trợ năng. CSS đặt thông báo tuyệt đối dưới tên nên tên không nhảy vị trí. */}
                {/* hiện thị tên thiết bị*/}
                <span className="device-name">
                  {deviceLabels[name]}
                  {/* Chữ “Đang xử lý…” chỉ hiện khi thiết bị đang chờ */}
                  {/*hiển thị chữ đang xử lí*/}
                  <span className="device-pending" role="status">
                    {pendingDevices[name] ? 'Đang xử lý…' : ''}
                  </span>
                </span>
                {/* nút bật tắt */}
                <button
                  className={'device-switch' + (on ? ' is-on' : '')}
                  type="button"
                  role="switch"
                  aria-label={deviceLabels[name]}
                  // role=switch + aria-checked thông báo bật/tắt; aria-busy báo đang xử lý; disabled chặn chuột/bàn phím.
                  aria-checked={on}
                  aria-busy={!!pendingDevices[name]}
                  // công tác bị khóa
                  disabled={!!pendingDevices[name]}
                  // ấn công tắc
                  onClick={() => toggleDevice(name)}
                >
                  {/* Phần tử rỗng này là nút tròn trắng của công tắc; CSS dịch sang phải khi class is-on được thêm. */}
                  <span />
                </button>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
