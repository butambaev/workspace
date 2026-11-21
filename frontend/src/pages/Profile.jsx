import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import api, { errMsg } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import { ErrorBox, PageHead } from '../components/ui.jsx';

function resize(file, size = 160) {
  return new Promise((resolve, reject) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = c.height = size;
      const s = Math.min(img.width, img.height);
      c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('bad image')); img.src = url;
  });
}

export default function Profile() {
  const { user, setUser } = useAuth(); const fileRef = useRef();
  const [f, setF] = useState({ first_name: user.first_name, last_name: user.last_name, email: user.email, avatar: user.avatar });
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const pick = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    try { setF({ ...f, avatar: await resize(file) }); } catch { setErr('Не удалось прочитать изображение'); }
  };
  const save = async (e) => {
    e.preventDefault(); setErr(''); setMsg('');
    try { const r = await api.patch('/auth/profile/', f); setUser(r.data); setMsg('Профиль сохранён'); } catch (e2) { setErr(errMsg(e2)); }
  };
  return (
    <>
      <PageHead title="Профиль" sub="Личные данные аккаунта" />
      <form className="card profile" onSubmit={save}>
        <div className="avatar-edit" onClick={() => fileRef.current.click()}><Avatar user={{ ...user, avatar: f.avatar }} size={96} /><span><Camera size={16} /></span></div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
        {f.avatar && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setF({ ...f, avatar: '' })}>Убрать аватар</button>}
        <ErrorBox msg={err} />{msg && <div className="alert ok">{msg}</div>}
        <div className="form">
          <div className="grid2"><label>Имя<input value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} /></label><label>Фамилия<input value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} /></label></div>
          <label>Email<input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
          <label>Логин<input disabled value={user.username} /></label><label>Роль<input disabled value={user.role} /></label>
          <button className="btn btn-primary">Сохранить</button>
        </div>
      </form>
    </>
  );
}
