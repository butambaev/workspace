import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import api from '../services/api.js';
import useFetch from '../hooks/useFetch.js';
import { Empty, ErrorBox, PageHead, Spinner } from '../components/ui.jsx';
import { fmtTime } from '../constants.js';

export default function Notifications() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useFetch('/notifications/', { page_size: 100 });
  const items = data?.results || [];
  const changed = () => window.dispatchEvent(new Event('notif-changed'));
  const open = async (n) => {
    if (!n.is_read) { await api.patch(`/notifications/${n.id}/read/`); changed(); reload(); }
    if (n.link) navigate(n.link);
  };
  const readAll = async () => { await api.post('/notifications/read-all/'); changed(); reload(); };
  return (
    <>
      <PageHead title="Уведомления" sub={`Непрочитанных: ${items.filter((n) => !n.is_read).length}`}>
        <button className="btn btn-ghost" onClick={readAll}><CheckCheck size={16} /> Прочитать все</button>
      </PageHead>
      <ErrorBox msg={error} onRetry={reload} />
      {loading && !data ? <Spinner /> : items.length === 0 ? <Empty icon={Bell} text="Уведомлений нет" /> : (
        <div className="card">
          {items.map((n) => (
            <div key={n.id} className={`notif ${n.is_read ? '' : 'unread'}`} onClick={() => open(n)}>
              <i /><div><span>{n.text}</span><small className="muted">{fmtTime(n.created_at)}</small></div>
              {!n.is_read && <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); api.patch(`/notifications/${n.id}/read/`).then(() => { changed(); reload(); }); }}>Прочитано</button>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
