import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { KanbanSquare, Pencil, Trash2, UserPlus, X } from 'lucide-react';
import api, { errMsg, list } from '../services/api.js';
import useFetch from '../hooks/useFetch.js';
import Avatar from '../components/Avatar.jsx';
import ProjectModal from '../components/ProjectModal.jsx';
import { ErrorBox, PageHead, PriorityBadge, Spinner, StatusBadge } from '../components/ui.jsx';
import { canManage, fmt } from '../constants.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProjectDetails() {
  const { id } = useParams(); const navigate = useNavigate(); const { user } = useAuth();
  const { data: p, loading, error, reload } = useFetch(`/projects/${id}/`);
  const { data: tasks } = useFetch('/tasks/', { project: id, page_size: 200 });
  const { data: team } = useFetch('/team/');
  const [edit, setEdit] = useState(false); const [err, setErr] = useState(''); const [sel, setSel] = useState('');
  if (loading && !p) return <Spinner />;
  if (error) return <ErrorBox msg={error} onRetry={reload} />;
  const manage = canManage(user, p);
  const candidates = (team || []).filter((u) => !p.members.some((m) => m.id === u.id));
  const act = async (fn) => { try { setErr(''); await fn(); reload(); } catch (e) { setErr(errMsg(e)); } };
  const remove = async () => {
    if (!window.confirm('Удалить проект вместе со всеми задачами?')) return;
    act(async () => { await api.delete(`/projects/${id}/`); navigate('/projects'); });
  };
  const tl = list({ data: tasks || { results: [] } });
  return (
    <>
      <PageHead title={p.name} sub={`Владелец: ${p.owner_name}`}>
        <Link className="btn btn-ghost" to={`/kanban?project=${p.id}`}><KanbanSquare size={16} /> Kanban</Link>
        {manage && <><button className="btn btn-ghost" onClick={() => setEdit(true)}><Pencil size={16} /> Изменить</button><button className="btn btn-danger" onClick={remove}><Trash2 size={16} /></button></>}
      </PageHead>
      <ErrorBox msg={err} />
      <div className="grid-main">
        <div className="card">
          <div className="row gap"><StatusBadge v={p.status} /><PriorityBadge v={p.priority} /></div>
          <p className="desc">{p.description || 'Описание не указано'}</p>
          <div className="info"><div><span className="muted">Начало</span><b>{fmt(p.start_date)}</b></div><div><span className="muted">Окончание</span><b>{fmt(p.end_date)}</b></div><div><span className="muted">Задач</span><b>{p.tasks_done}/{p.tasks_total}</b></div></div>
          <div className="bar big"><div style={{ width: `${p.progress}%` }} /></div><small className="muted">Выполнено {p.progress}%</small>
          <h3 style={{ marginTop: 24 }}>Задачи проекта</h3>
          {tl.length === 0 ? <p className="muted">Задач пока нет</p> : tl.map((t) => (
            <Link key={t.id} to={`/tasks?open=${t.id}`} className="list-row"><div><b>{t.title}</b><small className="muted">{t.assignee_name || 'Не назначен'} · до {fmt(t.deadline)}</small></div><StatusBadge kind="task" v={t.status} /></Link>
          ))}
        </div>
        <div className="card">
          <h3>Участники ({p.members.length})</h3>
          {p.members.map((m) => (
            <div key={m.id} className="list-row"><div className="row gap"><Avatar user={m} /><div><b>{m.full_name}</b><small className="muted">{m.role}{m.id === p.owner ? ' · владелец' : ''}</small></div></div>
              {manage && m.id !== p.owner && <button className="icon-btn" title="Удалить из проекта" onClick={() => act(() => api.delete(`/projects/${id}/members/${m.id}/`))}><X size={16} /></button>}</div>
          ))}
          {manage && (
            <div className="row gap" style={{ marginTop: 14 }}>
              <select value={sel} onChange={(e) => setSel(e.target.value)}><option value="">Добавить участника...</option>{candidates.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}</select>
              <button className="btn btn-primary" disabled={!sel} onClick={() => act(async () => { await api.post(`/projects/${id}/members/`, { user_id: sel }); setSel(''); })}><UserPlus size={16} /></button>
            </div>
          )}
        </div>
      </div>
      {edit && <ProjectModal project={p} onClose={() => setEdit(false)} onSaved={reload} />}
    </>
  );
}
