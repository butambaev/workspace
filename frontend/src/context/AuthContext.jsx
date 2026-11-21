import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('access')) { setLoading(false); return; }
    api.get('/auth/profile/').then((r) => setUser(r.data)).catch(() => {
      localStorage.removeItem('access'); localStorage.removeItem('refresh');
    }).finally(() => setLoading(false));
  }, []);

  const saveTokens = (d) => { localStorage.setItem('access', d.access); localStorage.setItem('refresh', d.refresh); };

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login/', { username, password });
    saveTokens(data);
    const p = await api.get('/auth/profile/');
    setUser(p.data);
  };
  const register = async (form) => {
    const { data } = await api.post('/auth/register/', form);
    saveTokens(data);
    setUser(data.user);
  };
  const logout = () => { localStorage.removeItem('access'); localStorage.removeItem('refresh'); setUser(null); };

  return <Ctx.Provider value={{ user, setUser, loading, login, register, logout }}>{children}</Ctx.Provider>;
}
