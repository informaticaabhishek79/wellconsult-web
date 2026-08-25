import { create } from 'zustand';
import { TokenStorage, api, API_BASE } from './api';
import axios from 'axios';

interface User { id: string; full_name: string; role: 'patient' | 'doctor' | 'admin'; email?: string; }

interface AuthStore {
  user: User | null;
  loading: boolean;
  error: string | null;
  init: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuth = create<AuthStore>((set) => ({
  user: (() => {
    try { return JSON.parse(localStorage.getItem('wc_user') || 'null'); }
    catch { return null; }
  })(),
  loading: false,
  error: null,

  init: () => {
    try {
      const u = JSON.parse(localStorage.getItem('wc_user') || 'null');
      set({ user: u });
    } catch { set({ user: null }); }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password }, { withCredentials: false });
      TokenStorage.set('access_token',  data.data.access_token);
      TokenStorage.set('refresh_token', data.data.refresh_token);
      localStorage.setItem('wc_user', JSON.stringify(data.data.user));
      set({ user: data.data.user, loading: false, error: null });
    } catch (err: any) {
      set({ loading: false, error: err.response?.data?.error?.message || 'Invalid email or password.' });
    }
  },

  logout: () => {
    TokenStorage.del('access_token');
    TokenStorage.del('refresh_token');
    localStorage.removeItem('wc_user');
    set({ user: null });
    window.location.href = '/';
  },

  clearError: () => set({ error: null }),
}));
