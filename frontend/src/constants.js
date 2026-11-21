export const PROJECT_STATUS = { planning: 'Планирование', active: 'Активный', on_hold: 'На паузе', completed: 'Завершён' };
export const PRIORITY = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };
export const TASK_STATUS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
export const ROLES = { admin: 'Admin', manager: 'Manager', member: 'Member' };
export const fmt = (d) => (d ? new Date(d).toLocaleDateString('ru-RU') : '—');
export const fmtTime = (d) => new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
export const canManage = (u, p) => !!(u && p && (u.role === 'admin' || (u.role === 'manager' && p.owner === u.id)));
