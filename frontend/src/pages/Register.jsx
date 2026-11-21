import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../services/api.js';
import { ErrorBox } from '../components/ui.jsx';

export default function Register() {
  const { register } = useAuth();
  const [f, setF] = useState({ username: '', email: '', first_name: '', last_name: '', password: '' });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await register(f); } catch (e2) { setErr(errMsg(e2)); setBusy(false); }
  };
  return (
    <div className="auth-page">
      <div className="orb o1" /><div className="orb o2" />
      <div className="auth-card glass">
        <div className="brand big"><div className="logo"><Zap size={22} /></div><span>WorkSpace</span></div>
        <h2>Создать аккаунт</h2><p className="muted">Начните управлять проектами уже сегодня</p>
        <form className="form" onSubmit={submit}>
          <ErrorBox msg={err} />
          <div className="grid2"><label>Имя<input value={f.first_name} onChange={set('first_name')} /></label><label>Фамилия<input value={f.last_name} onChange={set('last_name')} /></label></div>
          <label>Логин<input required value={f.username} onChange={set('username')} /></label>
          <label>Email<input required type="email" value={f.email} onChange={set('email')} /></label>
          <label>Пароль (мин. 8 символов)<input required type="password" minLength={8} value={f.password} onChange={set('password')} /></label>
          <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? 'Создание...' : 'Зарегистрироваться'}</button>
        </form>
        <p className="muted center">Уже есть аккаунт? <Link to="/login">Войти</Link></p>
      </div>
    </div>
  );
}
