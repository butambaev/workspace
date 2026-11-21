import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, MessageSquare, Plus } from 'lucide-react';
import api, { errMsg, list } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import TaskModal from '../components/TaskModal.jsx';
import { Empty, ErrorBox, PageHead, PriorityBadge, Spinner } from '../components/ui.jsx';
import { TASK_STATUS, fmt } from '../constants.js';

export default function Kanban() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [projects, setProjects] = useState(null); const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true); const [err, setErr] = useState('');
  const [modal, setModal] = useState(null); const [over, setOver] = useState(null);
  const pid = params.get('project');

  useEffect(() => {
    api.get('/projects/', { params: { page_size: 200 } }).then((r) => {
      const l = list(r); setProjects(l);
      if (!pid && l.length) setParams({ project: l[0].id }, { replace: true });
      if (!l.length) setLoading(false);
    }).catch((e) => { setErr(errMsg(e)); setLoading(false); });
    // eslint-disable-next-line
  }, []);

  const load = useCallback(() => {
    if (!pid) return;
    setLoading(true);
    api.get('/tasks/', { params: { project: pid, page_size: 200 } }).then((r) => setTasks(list(r)))
      .catch((e) => setErr(errMsg(e))).finally(() => setLoading(false));
  }, [pid]);
  useEffect(load, [load]);

  const drop = async (status, e) => {
    e.preventDefault(); setOver(null);
    const id = Number(e.dataTransfer.getData('text/plain'));
    const t = tasks.find((x) => x.id === id);
    if (!t || t.status === status) return;
    const prev = tasks;
    setTasks(tasks.map((x) => (x.id === id ? { ...x, status } : x)));
    try { await api.patch(`/tasks/${id}/`, { status }); setErr(''); }
    catch (e2) { setTasks(prev); setErr(errMsg(e2)); }
  };

  const project = projects?.find((p) => String(p.id) === String(pid));
  const manage = user.role === 'admin' || (user.role === 'manager' && project?.owner === user.id);
  if (projects === null && loading) return <Spinner />;
  return (
    <>
      <PageHead title="Kanban" sub="Перетаскивайте карточки между колонками — статус сохраняется на сервере">
        {projects?.length > 0 && <select value={pid || ''} onChange={(e) => setParams({ project: e.target.value })}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}
        {manage && <button className="btn btn-primary" onClick={() => setModal({ task: null })}><Plus size={16} /> Задача</button>}
      </PageHead>
      <ErrorBox msg={err} />
      {projects?.length === 0 ? <Empty text="Нет проектов для отображения доски" /> : (
        <div className="board">
          {Object.entries(TASK_STATUS).map(([status, label]) => {
            const col = tasks.filter((t) => t.status === status);
            return (
              <div key={status} className={`column ${over === status ? 'over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setOver(status); }} onDragLeave={() => setOver(null)} onDrop={(e) => drop(status, e)}>
                <div className="col-head"><span className={`dot d-${status}`} /><b>{label}</b><em>{col.length}</em></div>
                {loading && !tasks.length ? <Spinner /> : col.length === 0 && <div className="col-empty">Перетащите задачу сюда</div>}
                {col.map((t) => (
                  <div key={t.id} className="task-card" draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', String(t.id))} onClick={() => setModal({ task: t })}>
                    <div className="row between"><PriorityBadge v={t.priority} />{t.is_overdue && <span className="badge st-overdue">Просрочено</span>}</div>
                    <h4>{t.title}</h4>
                    <div className="row between muted small">
                      <span><Calendar size={12} /> {fmt(t.deadline)}</span><span><MessageSquare size={12} /> {t.comments_count}</span>
                      {t.assignee ? <Avatar user={{ full_name: t.assignee_name }} size={24} /> : <span>—</span>}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
      {modal && <TaskModal task={modal.task} projectId={pid} onClose={() => setModal(null)} onSaved={load} />}
    </>
  );
}
