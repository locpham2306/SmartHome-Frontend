import { apiRequest } from './api';

export function getLatestSensors(signal) {
  return apiRequest('/api/sensors/latest', { signal });
}

export function getSensorChart(type, signal) {
  const query = new URLSearchParams({ type, limit: '100' });
  return apiRequest(`/api/sensors/chart?${query}`, { signal });
}
