import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, FolderPlus, Plus, Users } from 'lucide-react';
import useFetch from '../hooks/useFetch.js';
import { Empty, ErrorBox, PageHead, PriorityBadge, Spinner, StatusBadge } from '../components/ui.jsx';
import ProjectModal from '../components/ProjectModal.jsx';
import { PROJECT_STATUS, fmt } from '../constants.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Projects() {
  const { user } = useAuth();
  const [search, setSearch] = useState(''); const [status, setStatus] = useState(''); const [modal, setModal] = useState(false);
  const { data, loading, error, reload } = useFetch('/projects/', { search, status, page_size: 100 });
  const items = data?.results || [];
  return (
    <>
      <PageHead title="Проекты" sub="Все проекты, к которым у вас есть доступ">
        {user.role !== 'member' && <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={16} /> Новый проект</button>}
      </PageHead>
      <div className="filters">
        <input placeholder="Поиск по названию..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Все статусы</option>{Object.entries(PROJECT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      </div>
      <ErrorBox msg={error} onRetry={reload} />
      {loading && !data ? <Spinner /> : items.length === 0 ? (
        <Empty icon={FolderPlus} text="Проектов не найдено">{user.role !== 'member' && <button className="btn btn-primary" onClick={() => setModal(true)}>Создать проект</button>}</Empty>
      ) : (
        <div className="cards">
          {items.map((p) => (
            <Link to={`/projects/${p.id}`} key={p.id} className="card project-card hover">
              <div className="row between"><StatusBadge v={p.status} /><PriorityBadge v={p.priority} /></div>
              <h3>{p.name}</h3><p className="muted clamp">{p.description || 'Без описания'}</p>
              <div className="bar"><div style={{ width: `${p.progress}%` }} /></div>
              <div className="row between muted small"><span>{p.progress}% выполнено</span><span>{p.tasks_done}/{p.tasks_total}</span></div>
              <div className="row between muted small"><span><Calendar size={13} /> {fmt(p.end_date)}</span><span><Users size={13} /> {p.members.length}</span></div>
            </Link>
          ))}
        </div>
      )}
      {modal && <ProjectModal onClose={() => setModal(false)} onSaved={reload} />}
    </>
  );
}
