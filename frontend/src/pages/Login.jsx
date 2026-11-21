import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, User, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../services/api.js';
import { ErrorBox } from '../components/ui.jsx';

export default function Login() {
  const { login } = useAuth();
  const [f, setF] = useState({ username: '', password: '' });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await login(f.username, f.password); }
    catch (e2) { setErr(e2.response?.status === 401 ? 'Неверный логин или пароль' : errMsg(e2)); setBusy(false); }
  };
  return (
    <div className="auth-page">
      <div className="orb o1" /><div className="orb o2" />
      <div className="auth-card glass">
        <div className="brand big"><div className="logo"><Zap size={22} /></div><span>WorkSpace</span></div>
        <h2>С возвращением</h2><p className="muted">Войдите, чтобы продолжить работу над проектами</p>
        <form className="form" onSubmit={submit}>
          <ErrorBox msg={err} />
          <label>Логин<div className="input-icon"><User size={16} /><input required autoFocus value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></div></label>
          <label>Пароль<div className="input-icon"><Lock size={16} /><input required type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div></label>
          <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? 'Вход...' : 'Войти'}</button>
        </form>
        <p className="muted center">Нет аккаунта? <Link to="/register">Зарегистрироваться</Link></p>
        <p className="hint">Демо: <b>admin</b> / <b>admin12345</b></p>
      </div>
    </div>
  );
}
