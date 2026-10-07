import React, { useLayoutEffect, useRef, useState } from 'react';
import { temperature, humidity, light } from '../data/dashboard';

export default function SensorChart({ lightOnly = false }) {
  const chartRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [{ width, height }, setDimensions] = useState({
    width: 574,
    height: 300,
  });
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setDimensions({ width, height });
    });
    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);
  const left = 43,
    right = width - 24,
    top = height < 160 ? 10 : 20,
    bottom = Math.max(40, height - 32);
  const max = lightOnly ? 700 : 100;
  const series = lightOnly
    ? [
      {
        values: light,
        color: '#f4ae16',
        id: 'light',
        label: 'Ánh sáng',
        unit: 'lux',
      },
    ]
    : [
      {
        values: humidity,
        color: '#2877ff',
        id: 'humidity',
        label: 'Độ ẩm',
        unit: '%',
      },
      {
        values: temperature,
        color: '#ee5274',
        id: 'temperature',
        label: 'Nhiệt độ',
        unit: '°C',
      },
    ];
  const ticks =
    height < 160
      ? [0, max / 2, max]
      : Array.from(
        { length: lightOnly ? 8 : 6 },
        (_, i) => i * (lightOnly ? 100 : 20),
      );
  const point = (value, i, count) => [
    left + (i / (count - 1)) * (right - left),
    bottom - (value / max) * (bottom - top),
  ];
  const count = series[0].values.length;
  const activeX = activeIndex === null ? left : point(0, activeIndex, count)[0];
  const tooltipWidth = Math.min(180, width - 8);
  const tooltipHeight = 30 + series.length * 22;
  const tooltipX = Math.max(
    4,
    Math.min(activeX + 12, width - tooltipWidth - 4),
  );
  const tooltipY = Math.max(4, Math.min(top, height - tooltipHeight - 4));
  const seconds = Math.round(((activeIndex ?? 0) / (count - 1)) * 14 * 60);
  const time = `10:${String(22 + Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  // Xử lý vị trí chuột để chọn điểm dữ liệu gần nhất.
  const showNearestPoint = (event) => {
    const matrix = chartRef.current.getScreenCTM();
    if (!matrix) return;
    const { x, y } = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      matrix.inverse(),
    );
    if (x < left || x > right || y < top || y > bottom) {
      setActiveIndex(null);
      return;
    }
    setActiveIndex(Math.round(((x - left) / (right - left)) * (count - 1)));
  };
  return (
    <svg
      className="sensor-chart"
      ref={chartRef}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      tabIndex={0}
      // Bắt sự kiện di chuyển chuột trên biểu đồ.
      onPointerMove={showNearestPoint}
      onPointerLeave={() => setActiveIndex(null)}
      onFocus={() => setActiveIndex(0)}
      onBlur={() => setActiveIndex(null)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setActiveIndex(null);
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          const direction = event.key === 'ArrowRight' ? 1 : -1;
          setActiveIndex((index) =>
            Math.max(0, Math.min(count - 1, (index ?? 0) + direction)),
          );
        }
      }}
      aria-label={
        lightOnly
          ? 'Cường độ ánh sáng theo thời gian, đơn vị lux'
          : 'Nhiệt độ và độ ẩm theo thời gian'
      }
    >
      <defs>
        {series.map(({ color, id }) => (
          <linearGradient
            key={id}
            id={'fill-' + id}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor={color} stopOpacity=".08" />
            <stop offset="100%" stopColor={color} stopOpacity=".01" />
          </linearGradient>
        ))}
      </defs>
      {ticks.map((value) => {
        const y = bottom - (value / max) * (bottom - top);
        return (
          <g key={value}>
            <line x1={left} y1={y} x2={right} y2={y} className="chart-grid" />
            <text x={left - 14} y={y + 5} textAnchor="end">
              {value}
            </text>
          </g>
        );
      })}
      {Array.from({ length: 8 }, (_, i) => {
        const x = left + (i / 7) * (right - left);
        return (
          <g key={i}>
            <line x1={x} y1={top} x2={x} y2={bottom} className="chart-grid" />
            <text
              x={x}
              y={bottom + 24}
              textAnchor="middle"
              className={lightOnly ? 'light-axis-label' : ''}
            >
              10:{22 + i * 2}
            </text>
          </g>
        );
      })}
      {series.map(({ values, color, id }) => {
        const points = values.map((value, i) => point(value, i, values.length));
        const path = points
          .map(([x, y], i) => (i ? 'L' : 'M') + x + ',' + y)
          .join(' ');
        return (
          <g key={id}>
            {id === 'temperature' && (
              <path
                d={
                  path +
                  ' L' +
                  right +
                  ',' +
                  bottom +
                  ' L' +
                  left +
                  ',' +
                  bottom +
                  ' Z'
                }
                fill="white"
              />
            )}
            <path
              d={
                path +
                ' L' +
                right +
                ',' +
                bottom +
                ' L' +
                left +
                ',' +
                bottom +
                ' Z'
              }
              fill={'url(#fill-' + id + ')'}
            />
            <path d={path} fill="none" stroke={color} strokeWidth="2.5" />
            {points.map(([x, y], i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="3"
                fill="white"
                stroke={color}
                strokeWidth="2.2"
              >
                <title>
                  {values[i]}
                  {lightOnly ? ' lux' : id === 'humidity' ? '%' : '°C'}
                </title>
              </circle>
            ))}
          </g>
        );
      })}
      {/* hiển thị hộp giá trị */}
      {activeIndex !== null && (
        <g className="chart-inspection" pointerEvents="none">
          <line
            x1={activeX}
            x2={activeX}
            y1={top}
            y2={bottom}
            className="chart-crosshair"
          />
          {series.map(({ values, color, id }) => (
            <circle
              key={id}
              cx={activeX}
              cy={point(values[activeIndex], activeIndex, count)[1]}
              r="5"
              fill="white"
              stroke={color}
              strokeWidth="2.5"
            />
          ))}
          {/*khung toolTip*/}
          <g transform={`translate(${tooltipX}, ${tooltipY})`} role="tooltip">
            <rect
              width={tooltipWidth}
              height={tooltipHeight}
              rx="6"
              className="chart-tooltip-surface"
            />
            <text x="12" y="20" className="chart-tooltip-time">
              {time}
            </text>
            {series.map(({ values, color, id, label, unit }, index) => (
              <g key={id} transform={`translate(12, ${40 + index * 22})`}>
                <circle cx="3" cy="-4" r="3" fill={color} />
                {/* Hiển thị tên cảm biến, giá trị và đơn vị */}
                <text x="14" y="0">
                  {label}: {values[activeIndex]} {unit}
                </text>
              </g>
            ))}
          </g>
        </g>
      )}
    </svg>
  );
}
