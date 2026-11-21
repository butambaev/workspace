import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api' });

api.interceptors.request.use((c) => {
  const t = localStorage.getItem('access');
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

let refreshing = null;
api.interceptors.response.use(
  (r) => r,
  async (e) => {
    const o = e.config;
    const isAuthCall = /auth\/(login|refresh|register)/.test(o?.url || '');
    if (e.response?.status === 401 && !o._retry && !isAuthCall && localStorage.getItem('refresh')) {
      o._retry = true;
      try {
        refreshing = refreshing || axios
          .post(`${api.defaults.baseURL}/auth/refresh/`, { refresh: localStorage.getItem('refresh') })
          .finally(() => { refreshing = null; });
        const { data } = await refreshing;
        localStorage.setItem('access', data.access);
        if (data.refresh) localStorage.setItem('refresh', data.refresh);
        o.headers.Authorization = `Bearer ${data.access}`;
        return api(o);
      } catch {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        window.location.href = '/login';
      }
    }
    return Promise.reject(e);
  }
);

export const errMsg = (e) => {
  const d = e.response?.data;
  if (!d) return 'Нет связи с сервером';
  if (typeof d === 'string') return 'Ошибка сервера';
  if (d.detail) return d.detail;
  return Object.entries(d).map(([k, v]) => `${k}: ${[].concat(v).join(' ')}`).join('\n');
};
export const list = (r) => r.data.results ?? r.data;
export default api;
