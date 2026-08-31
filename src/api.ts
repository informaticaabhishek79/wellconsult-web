import axios from 'axios';

export const API_BASE = 'https://deemona-doctors-backend.onrender.com/api/v1';

const isWeb = typeof window !== 'undefined';

export const TokenStorage = {
  get: (k: string) => isWeb ? localStorage.getItem(k) : null,
  set: (k: string, v: string) => isWeb && localStorage.setItem(k, v),
  del: (k: string) => isWeb && localStorage.removeItem(k),
};

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

api.interceptors.request.use(config => {
  const token = TokenStorage.get('access_token');
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  async err => {
    if (err.response?.status === 401) {
      TokenStorage.del('access_token');
      TokenStorage.del('refresh_token');
      TokenStorage.del('wc_user');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);
