import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClipboardList, Plus } from 'lucide-react';
import api, { list } from '../services/api.js';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import TaskModal from '../components/TaskModal.jsx';
import { Empty, ErrorBox, PageHead, PriorityBadge, Spinner, StatusBadge } from '../components/ui.jsx';
import { PRIORITY, TASK_STATUS, fmt } from '../constants.js';

export default function Tasks() {
  const { user } = useAuth();
  const [sp, setSp] = useSearchParams();
  const [f, setF] = useState({ search: sp.get('search') || '', status: '', priority: '', project: '', mine: '', ordering: '-created_at' });
  const [page, setPage] = useState(1); const [modal, setModal] = useState(null); const [projects, setProjects] = useState([]);
  const params = { ...Object.fromEntries(Object.entries(f).filter(([, v]) => v !== '')), page };
  const { data, loading, error, reload } = useFetch('/tasks/', params);

  useEffect(() => { setF((p) => ({ ...p, search: sp.get('search') || '' })); setPage(1); }, [sp.get('search')]);
  useEffect(() => { api.get('/projects/', { params: { page_size: 200 } }).then((r) => setProjects(list(r))); }, []);
  useEffect(() => {
    const id = sp.get('open');
    if (id) api.get(`/tasks/${id}/`).then((r) => setModal({ task: r.data })).catch(() => {}).finally(() => { sp.delete('open'); setSp(sp, { replace: true }); });
    // eslint-disable-next-line
  }, [sp.get('open')]);

  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setPage(1); };
  const items = data?.results || [];
  const pages = Math.max(1, Math.ceil((data?.count || 0) / 20));
  return (
    <>
      <PageHead title="Задачи" sub={`Всего: ${data?.count ?? 0}`}>
        {user.role !== 'member' && <button className="btn btn-primary" onClick={() => setModal({ task: null })}><Plus size={16} /> Новая задача</button>}
      </PageHead>
      <div className="filters">
        <input placeholder="Поиск..." value={f.search} onChange={set('search')} />
        <select value={f.status} onChange={set('status')}><option value="">Все статусы</option>{Object.entries(TASK_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select value={f.priority} onChange={set('priority')}><option value="">Любой приоритет</option>{Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select value={f.project} onChange={set('project')}><option value="">Все проекты</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select value={f.mine} onChange={set('mine')}><option value="">Все задачи</option><option value="true">Назначенные мне</option></select>
        <select value={f.ordering} onChange={set('ordering')}><option value="-created_at">Сначала новые</option><option value="created_at">Сначала старые</option><option value="deadline">По дедлайну ↑</option><option value="-deadline">По дедлайну ↓</option><option value="title">По названию</option></select>
      </div>
      <ErrorBox msg={error} onRetry={reload} />
      {loading && !data ? <Spinner /> : items.length === 0 ? <Empty icon={ClipboardList} text="Задачи не найдены" /> : (
        <div className="card table-wrap">
          <table>
            <thead><tr><th>Задача</th><th>Проект</th><th>Исполнитель</th><th>Приоритет</th><th>Статус</th><th>Дедлайн</th></tr></thead>
            <tbody>
              {items.map((t) => (
                <tr key={t.id} onClick={() => setModal({ task: t })}>
                  <td><b>{t.title}</b></td><td>{t.project_name}</td><td>{t.assignee_name || '—'}</td>
                  <td><PriorityBadge v={t.priority} /></td><td><StatusBadge kind="task" v={t.status} /></td>
                  <td className={t.is_overdue ? 'danger-text' : ''}>{fmt(t.deadline)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && <div className="row center gap pager"><button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button><span>{page} / {pages}</span><button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>→</button></div>}
      {modal && <TaskModal task={modal.task} onClose={() => setModal(null)} onSaved={reload} />}
    </>
  );
}
