import { apiRequest } from './api';

export function getLatestSensors(signal) {
  return apiRequest('/api/sensors/latest', { signal });
}
