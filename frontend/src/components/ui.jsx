import { X } from 'lucide-react';
import { PRIORITY, PROJECT_STATUS, TASK_STATUS } from '../constants.js';

export const Spinner = () => <div className="center-block"><div className="spinner" /></div>;
export const ErrorBox = ({ msg, onRetry }) => msg ? (
  <div className="alert error">{msg}{onRetry && <button className="btn btn-ghost btn-sm" onClick={onRetry}>Повторить</button>}</div>
) : null;
export const Empty = ({ icon: Icon, text, children }) => (
  <div className="empty">{Icon && <Icon size={36} />}<p>{text}</p>{children}</div>
);
export const PriorityBadge = ({ v }) => <span className={`badge prio-${v}`}>{PRIORITY[v]}</span>;
export const StatusBadge = ({ v, kind = 'project' }) => (
  <span className={`badge st-${v}`}>{(kind === 'project' ? PROJECT_STATUS : TASK_STATUS)[v]}</span>
);
export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal glass ${wide ? 'wide' : ''}`}>
        <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}><X size={18} /></button></div>
        {children}
      </div>
    </div>
  );
}
export const PageHead = ({ title, sub, children }) => (
  <div className="page-head"><div><h1>{title}</h1>{sub && <p className="muted">{sub}</p>}</div><div className="row gap">{children}</div></div>
);
