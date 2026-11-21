import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, CheckSquare, FolderKanban, KanbanSquare, LayoutDashboard, LogOut, Menu, Search, Settings, UserCircle, Users, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import Avatar from './Avatar.jsx';

const nav = [
  ['/', 'Dashboard', LayoutDashboard], ['/projects', 'Проекты', FolderKanban], ['/kanban', 'Kanban', KanbanSquare],
  ['/tasks', 'Задачи', CheckSquare], ['/team', 'Команда', Users], ['/notifications', 'Уведомления', Bell],
  ['/profile', 'Профиль', UserCircle], ['/settings', 'Настройки', Settings],
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [q, setQ] = useState('');

  const loadUnread = useCallback(() => {
    api.get('/notifications/unread-count/').then((r) => setUnread(r.data.count)).catch(() => {});
  }, []);
  useEffect(() => {
    loadUnread();
    const t = setInterval(loadUnread, 30000);
    window.addEventListener('notif-changed', loadUnread);
    return () => { clearInterval(t); window.removeEventListener('notif-changed', loadUnread); };
  }, [loadUnread]);

  const search = (e) => { e.preventDefault(); navigate(`/tasks?search=${encodeURIComponent(q)}`); setOpen(false); };

  return (
    <div className="app">
      <aside className={`sidebar glass ${open ? 'open' : ''}`}>
        <div className="brand"><div className="logo"><Zap size={18} /></div><span>WorkSpace</span></div>
        <nav>
          {nav.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={18} /><span>{label}</span>
              {to === '/notifications' && unread > 0 && <em className="count">{unread}</em>}
            </NavLink>
          ))}
        </nav>
        <button className="nav-item logout" onClick={logout}><LogOut size={18} /><span>Выйти</span></button>
      </aside>
      <div className="main">
        <header className="topbar glass">
          <button className="icon-btn mobile-only" onClick={() => setOpen(!open)}><Menu size={20} /></button>
          <form className="search" onSubmit={search}>
            <Search size={16} /><input placeholder="Поиск задач..." value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <div className="row gap">
            <button className="icon-btn bell" onClick={() => navigate('/notifications')} title="Уведомления">
              <Bell size={19} />{unread > 0 && <i>{unread > 9 ? '9+' : unread}</i>}
            </button>
            <div className="user-chip" onClick={() => navigate('/profile')}>
              <Avatar user={user} size={34} />
              <div><b>{user.full_name}</b><small>{user.role}</small></div>
            </div>
          </div>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
