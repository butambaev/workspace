import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import api, { errMsg, list } from '../services/api.js';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import { Empty, ErrorBox, Modal, PageHead, Spinner } from '../components/ui.jsx';
import { ROLES, canManage } from '../constants.js';

export default function Team() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch('/team/');
  const [err, setErr] = useState(''); const [add, setAdd] = useState(null); const [projects, setProjects] = useState([]); const [pid, setPid] = useState('');
  useEffect(() => {
    if (user.role !== 'member') api.get('/projects/', { params: { page_size: 200 } }).then((r) => setProjects(list(r).filter((p) => canManage(user, p))));
  }, [user]);
  const changeRole = async (id, role) => {
    try { setErr(''); await api.patch(`/team/${id}/role/`, { role }); reload(); } catch (e) { setErr(errMsg(e)); }
  };
  const addToProject = async () => {
    try { await api.post(`/projects/${pid}/members/`, { user_id: add.id }); setAdd(null); setPid(''); reload(); } catch (e) { setErr(errMsg(e)); setAdd(null); }
  };
  if (loading && !data) return <Spinner />;
  return (
    <>
      <PageHead title="Команда" sub="Участники, роли и проекты" />
      <ErrorBox msg={error || err} onRetry={reload} />
      {data?.length === 0 ? <Empty text="Участников пока нет" /> : (
        <div className="cards">
          {data?.map((u) => (
            <div key={u.id} className="card member">
              <Avatar user={u} size={56} /><h3>{u.full_name}</h3><p className="muted">{u.email}</p>
              {user.role === 'admin' && u.id !== user.id ? (
                <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>{Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
              ) : <span className={`badge role-${u.role}`}>{ROLES[u.role]}</span>}
              <div className="chips">{u.projects.length ? u.projects.map((p) => <span key={p.id} className="chip">{p.name}</span>) : <small className="muted">Нет проектов</small>}</div>
              {projects.length > 0 && <button className="btn btn-ghost btn-sm" onClick={() => setAdd(u)}><UserPlus size={14} /> В проект</button>}
            </div>
          ))}
        </div>
      )}
      {add && (
        <Modal title={`Добавить ${add.full_name} в проект`} onClose={() => setAdd(null)}>
          <div className="form"><select value={pid} onChange={(e) => setPid(e.target.value)}><option value="">Выберите проект</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
            <div className="row end gap"><button className="btn btn-ghost" onClick={() => setAdd(null)}>Отмена</button><button className="btn btn-primary" disabled={!pid} onClick={addToProject}>Добавить</button></div></div>
        </Modal>
      )}
    </>
  );
}
