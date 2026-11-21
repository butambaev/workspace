import { useEffect, useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import api, { errMsg, list } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PRIORITY, TASK_STATUS, canManage, fmtTime } from '../constants.js';
import Avatar from './Avatar.jsx';
import { ErrorBox, Modal } from './ui.jsx';

export default function TaskModal({ task, projectId, onClose, onSaved }) {
  const { user } = useAuth();
  const isNew = !task;
  const [projects, setProjects] = useState([]);
  const [project, setProject] = useState(null);
  const [f, setF] = useState({
    title: task?.title || '', description: task?.description || '', project: task?.project || projectId || '',
    assignee: task?.assignee || '', priority: task?.priority || 'medium', status: task?.status || 'todo', deadline: task?.deadline || '',
  });
  const [comments, setComments] = useState([]); const [text, setText] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/projects/', { params: { page_size: 200 } }).then((r) => {
      const l = list(r); setProjects(l);
      if (!f.project && l.length) setF((p) => ({ ...p, project: l[0].id }));
    });
    // eslint-disable-next-line
  }, []);
  useEffect(() => { if (f.project) api.get(`/projects/${f.project}/`).then((r) => setProject(r.data)); }, [f.project]);
  useEffect(() => { if (task) api.get(`/tasks/${task.id}/comments/`).then((r) => setComments(r.data)); }, [task]);

  const manage = isNew || canManage(user, project);
  const statusOnly = !manage && task?.assignee === user.id;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      if (isNew) await api.post('/tasks/', { ...f, assignee: f.assignee || null, deadline: f.deadline || null });
      else if (statusOnly) await api.patch(`/tasks/${task.id}/`, { status: f.status });
      else await api.patch(`/tasks/${task.id}/`, { ...f, assignee: f.assignee || null, deadline: f.deadline || null });
      onSaved(); onClose();
    } catch (e2) { setErr(errMsg(e2)); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!window.confirm('Удалить задачу?')) return;
    try { await api.delete(`/tasks/${task.id}/`); onSaved(); onClose(); } catch (e2) { setErr(errMsg(e2)); }
  };
  const addComment = async (e) => {
    e.preventDefault(); if (!text.trim()) return;
    try { const r = await api.post(`/tasks/${task.id}/comments/`, { text }); setComments([...comments, r.data]); setText(''); }
    catch (e2) { setErr(errMsg(e2)); }
  };

  return (
    <Modal title={isNew ? 'Новая задача' : 'Задача'} onClose={onClose} wide>
      <form className="form" onSubmit={save}>
        <ErrorBox msg={err} />
        <label>Название<input required disabled={!manage} value={f.title} onChange={set('title')} /></label>
        <label>Описание<textarea rows={3} disabled={!manage} value={f.description} onChange={set('description')} /></label>
        <div className="grid2">
          <label>Проект<select disabled={!isNew} value={f.project} onChange={(e) => setF({ ...f, project: e.target.value, assignee: '' })} required>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label>Исполнитель<select disabled={!manage} value={f.assignee} onChange={set('assignee')}>
            <option value="">Не назначен</option>{project?.members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}</select></label>
          <label>Приоритет<select disabled={!manage} value={f.priority} onChange={set('priority')}>{Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label>Статус<select disabled={!manage && !statusOnly} value={f.status} onChange={set('status')}>{Object.entries(TASK_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label>Дедлайн<input type="date" disabled={!manage} value={f.deadline} onChange={set('deadline')} /></label>
          {task && <label>Создатель<input disabled value={task.creator_name} /></label>}
        </div>
        <div className="row between">
          {task && manage ? <button type="button" className="btn btn-danger" onClick={remove}><Trash2 size={15} /> Удалить</button> : <span />}
          <div className="row gap"><button type="button" className="btn btn-ghost" onClick={onClose}>Закрыть</button>
            {(manage || statusOnly) && <button className="btn btn-primary" disabled={busy}>{busy ? 'Сохранение...' : 'Сохранить'}</button>}</div>
        </div>
      </form>
      {task && (
        <div className="comments">
          <h4>Комментарии ({comments.length})</h4>
          {comments.length === 0 && <p className="muted">Пока нет комментариев</p>}
          {comments.map((c) => (
            <div key={c.id} className="comment"><Avatar user={c} size={30} />
              <div><b>{c.author_name}</b> <small className="muted">{fmtTime(c.created_at)}</small><p>{c.text}</p></div></div>
          ))}
          <form className="row gap" onSubmit={addComment}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Написать комментарий..." />
            <button className="btn btn-primary"><Send size={15} /></button>
          </form>
        </div>
      )}
    </Modal>
  );
}
