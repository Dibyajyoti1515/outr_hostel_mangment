import axios from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: BASE_URL, timeout: 10000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('outr_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('outr_token');
      localStorage.removeItem('outr_user');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Student API ──────────────────────────────────────────────────────────
export const studentApi = {
  login: (registrationNo: string, password: string) =>
    api.post('/student/login', { registrationNo, password }),
  profile: () => api.get('/student/profile'),
  getPreference: (date?: string) =>
    api.get('/student/food/preference', { params: { date } }),
  setPreference: (data: object) => api.put('/student/food/preference', data),
  getCalendar: () => api.get('/student/food/calendar'),
  getQR: () => api.get('/student/qr'),
};

// ── Management API ────────────────────────────────────────────────────────
export const managementApi = {
  login: (email: string, password: string) =>
    api.post('/management/login', { email, password }),
  profile: () => api.get('/management/profile'),
  getDashboard: (date?: string, hostelName?: string) =>
    api.get('/management/dashboard', { params: { date, hostelName } }),
  getStudents: (params: object) => api.get('/management/students', { params }),
  createStudent: (data: object) => api.post('/management/students', data),
  bulkCreate: (students: object[]) =>
    api.post('/management/students/bulk', { students }),
  updateStudent: (id: string, data: object) =>
    api.patch(`/management/students/${id}`, data),
  resetPassword: (id: string, newPassword: string) =>
    api.post(`/management/students/${id}/reset-password`, { newPassword }),
  scanQR: (token: string) => api.post('/management/scan', { token }),
  getScanHistory: (params: object) =>
    api.get('/management/scan/history', { params }),
};