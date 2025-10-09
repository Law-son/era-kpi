import axios from 'axios';

const API_BASE_URL = 'https://era-kpi-api.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  verifyToken: () => api.get('/auth/verify'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', data),
};

export const companiesApi = {
  getAll: () => api.get('/companies'),
  create: (data: any) => api.post('/companies', data),
  update: (id: string, data: any) => api.put(`/companies/${id}`, data),
  delete: (id: string) => api.delete(`/companies/${id}`),
};

export const usersApi = {
  getAll: () => api.get('/users'),
  getByCompany: (companyId: string) => {
    console.log('API: Getting users for company:', companyId);
    return api.get(`/users/company/${companyId}`);
  },
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const tasksApi = {
  getAll: (companyId?: string) => {
    console.log('API: Getting tasks', companyId ? `for company: ${companyId}` : 'for all companies');
    return api.get(`/tasks${companyId ? `?company=${companyId}` : ''}`);
  },
  getByUser: (userId: string) => api.get(`/tasks/user/${userId}`),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  submit: (id: string, data: any) => api.put(`/tasks/${id}/submit`, data),
  score: (id: string, data: any) => api.put(`/tasks/${id}/score`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

export const leaderboardApi = {
  getMonthly: (year: number, month: number) => api.get(`/leaderboard/monthly/${year}/${month}`),
  getYearly: (year: number) => api.get(`/leaderboard/yearly/${year}`),
  getTop10: (companyId: string, userId: string, year?: number, month?: number) => 
    api.get(`/leaderboard/top10/${companyId}?userId=${userId}&year=${year}&month=${month}`),
  generate: (type: 'monthly' | 'yearly', year: number, month?: number) =>
    api.post('/leaderboard/generate', { type, year, month }),
};

export const announcementsApi = {
  getAll: (companyId?: string) => api.get(`/announcements${companyId ? `?company=${companyId}` : ''}`),
  create: (data: any) => api.post('/announcements', data),
  update: (id: string, data: any) => api.put(`/announcements/${id}`, data),
  pin: (id: string) => api.put(`/announcements/${id}/pin`),
  delete: (id: string) => api.delete(`/announcements/${id}`),
};

export const kpiApi = {
  getExecutiveStats: (userId: string) => api.get(`/kpi/executive/${userId}`),
  getCompanyStats: (companyId: string) => api.get(`/kpi/company/${companyId}`),
  getOverallStats: () => api.get('/kpi/overall'),
};

export const badgesApi = {
  getAll: () => api.get('/badges'),
  assign: (data: any) => api.post('/badges/assign', data),
  getUserBadges: (userId: string) => api.get(`/badges/user/${userId}`),
};

export default api;