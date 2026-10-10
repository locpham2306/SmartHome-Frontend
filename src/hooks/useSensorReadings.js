import { useCallback, useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { getLatestSensors } from '../services/sensors';
import { isSensorSnapshot, mergeSensorReadings } from '../utils/sensorReadings';

export default function useSensorReadings() {
  const [readings, setReadings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connection, setConnection] = useState('connecting');
  const refreshRef = useRef(null);
  const retry = useCallback(() => refreshRef.current?.(), []);

  useEffect(() => {
    let disposed = false;
    let requestController;
    let liveRevision = 0;

    const acceptSnapshot = (snapshot) => {
      if (!isSensorSnapshot(snapshot)) {
        throw new Error('Dữ liệu cảm biến nhận được không hợp lệ.');
      }
      setReadings((previous) => mergeSensorReadings(previous, snapshot));
      setLoading(false);
      setError('');
    };

    const refresh = async () => {
      requestController?.abort();
      const controller = new AbortController();
      requestController = controller;
      const startedRevision = liveRevision;
      let timedOut = false;
      setLoading(true);
      const timer = window.setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, 10000);

      try {
        const snapshot = await getLatestSensors(controller.signal);
        if (!disposed && !controller.signal.aborted) acceptSnapshot(snapshot);
      } catch (failure) {
        if (disposed || requestController !== controller) return;
        // Nếu realtime đã nhận số đo trong lúc chờ REST, vẫn hiển thị số đo đó.
        if (
          liveRevision === startedRevision &&
          (timedOut || failure.name !== 'AbortError')
        ) {
          setError(
            timedOut
              ? 'Máy chủ phản hồi quá chậm. Vui lòng thử lại.'
              : failure.message,
          );
        }
      } finally {
        window.clearTimeout(timer);
        if (!disposed && requestController === controller) setLoading(false);
      }
    };

    refreshRef.current = refresh;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const client = new Client({
      brokerURL: `${protocol}//${window.location.host}/ws`,
      reconnectDelay: 5000,
      connectionTimeout: 10000,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      onConnect: () => {
        if (disposed) return;
        setConnection('connected');
        client.subscribe('/topic/sensors', (message) => {
          if (disposed) return;
          try {
            const body = JSON.parse(message.body);
            if (body?.success !== true)
              throw new Error('Không nhận được dữ liệu cảm biến hợp lệ.');
            acceptSnapshot(body.data);
            liveRevision += 1;
          } catch (failure) {
            setError(failure.message);
          }
        });
        // Tải lại sau mỗi lần kết nối để bù số đo bị lỡ khi mất mạng.
        void refresh();
      },
      onWebSocketClose: () => {
        if (!disposed) setConnection('reconnecting');
      },
      onWebSocketError: () => {
        if (!disposed) setConnection('reconnecting');
      },
      onStompError: () => {
        if (!disposed) {
          setConnection('reconnecting');
          setError(
            'Không đăng ký được cập nhật cảm biến. Đang thử kết nối lại.',
          );
        }
        void client.forceDisconnect();
      },
    });

    void refresh();
    client.activate();
    return () => {
      disposed = true;
      refreshRef.current = null;
      requestController?.abort();
      void client.deactivate();
    };
  }, []);

  return { readings, loading, error, connection, retry };
}
