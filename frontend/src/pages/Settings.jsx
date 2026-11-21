import { useState } from 'react';
import api, { errMsg } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ErrorBox, PageHead } from '../components/ui.jsx';

export default function Settings() {
  const { logout } = useAuth();
  const [f, setF] = useState({ old_password: '', new_password: '' });
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setMsg('');
    try { await api.post('/auth/change-password/', f); setMsg('Пароль изменён'); setF({ old_password: '', new_password: '' }); } catch (e2) { setErr(errMsg(e2)); }
  };
  return (
    <>
      <PageHead title="Настройки" sub="Безопасность аккаунта" />
      <div className="card profile">
        <h3>Смена пароля</h3>
        <ErrorBox msg={err} />{msg && <div className="alert ok">{msg}</div>}
        <form className="form" onSubmit={submit}>
          <label>Текущий пароль<input type="password" required value={f.old_password} onChange={(e) => setF({ ...f, old_password: e.target.value })} /></label>
          <label>Новый пароль (мин. 8 символов)<input type="password" required minLength={8} value={f.new_password} onChange={(e) => setF({ ...f, new_password: e.target.value })} /></label>
          <button className="btn btn-primary">Изменить пароль</button>
        </form>
        <hr /><h3>Сессия</h3><button className="btn btn-danger" onClick={logout}>Выйти из аккаунта</button>
      </div>
    </>
  );
}
