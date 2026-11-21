import { useState } from 'react';
import api, { errMsg } from '../services/api.js';
import { PRIORITY, PROJECT_STATUS } from '../constants.js';
import { ErrorBox, Modal } from './ui.jsx';

export default function ProjectModal({ project, onClose, onSaved }) {
  const [f, setF] = useState({
    name: project?.name || '', description: project?.description || '', start_date: project?.start_date || '',
    end_date: project?.end_date || '', priority: project?.priority || 'medium', status: project?.status || 'planning',
  });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    const body = { ...f, start_date: f.start_date || null, end_date: f.end_date || null };
    try {
      const r = project ? await api.patch(`/projects/${project.id}/`, body) : await api.post('/projects/', body);
      onSaved(r.data); onClose();
    } catch (e2) { setErr(errMsg(e2)); } finally { setBusy(false); }
  };
  return (
    <Modal title={project ? 'Редактировать проект' : 'Новый проект'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <ErrorBox msg={err} />
        <label>Название<input required value={f.name} onChange={set('name')} /></label>
        <label>Описание<textarea rows={3} value={f.description} onChange={set('description')} /></label>
        <div className="grid2">
          <label>Дата начала<input type="date" value={f.start_date} onChange={set('start_date')} /></label>
          <label>Дата окончания<input type="date" value={f.end_date} onChange={set('end_date')} /></label>
          <label>Приоритет<select value={f.priority} onChange={set('priority')}>{Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label>Статус<select value={f.status} onChange={set('status')}>{Object.entries(PROJECT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        </div>
        <div className="row end gap"><button type="button" className="btn btn-ghost" onClick={onClose}>Отмена</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Сохранение...' : 'Сохранить'}</button></div>
      </form>
    </Modal>
  );
}
