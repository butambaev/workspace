import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, FolderKanban, ListTodo } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useFetch from '../hooks/useFetch.js';
import { Empty, ErrorBox, PageHead, PriorityBadge, Spinner } from '../components/ui.jsx';
import { fmtTime } from '../constants.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: d, loading, error, reload } = useFetch('/dashboard/');
  if (loading && !d) return <Spinner />;
  if (error) return <ErrorBox msg={error} onRetry={reload} />;
  const stats = [
    ['Проектов', d.projects_total, FolderKanban, 'violet'], ['Активные задачи', d.tasks_active, ListTodo, 'blue'],
    ['Выполнено', d.tasks_done, CheckCircle2, 'green'], ['Просрочено', d.tasks_overdue, AlertTriangle, 'red'],
  ];
  return (
    <>
      <PageHead title={`Привет, ${user.first_name || user.username} 👋`} sub="Вот что происходит в ваших проектах" />
      <div className="stats">
        {stats.map(([label, v, Icon, c]) => (
          <div key={label} className={`stat card glow-${c}`}><div className={`stat-icon ${c}`}><Icon size={22} /></div><div><span className="muted">{label}</span><strong>{v}</strong></div></div>
        ))}
      </div>
      <div className="grid-main">
        <div className="card">
          <h3>Выполненные задачи за 7 дней</h3>
          <div style={{ height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={d.chart}>
                <defs><linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#3b82f6" /></linearGradient></defs>
                <CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} />
                <XAxis dataKey="date" stroke="#8890b0" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke="#8890b0" tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,.04)' }} contentStyle={{ background: '#161a33', border: '1px solid #2a3058', borderRadius: 12 }} />
                <Bar dataKey="completed" name="Выполнено" fill="url(#gr)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <h3>Прогресс проектов</h3>
          {d.projects_progress.length === 0 ? <Empty text="Нет проектов" /> : d.projects_progress.map((p) => (
            <Link to={`/projects/${p.id}`} key={p.id} className="progress-row">
              <div className="row between"><span>{p.name}</span><b>{p.progress}%</b></div>
              <div className="bar"><div style={{ width: `${p.progress}%` }} /></div>
            </Link>
          ))}
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <h3>Последние проекты</h3>
          {d.recent_projects.length === 0 ? <Empty text="Проектов пока нет" /> : d.recent_projects.map((p) => (
            <Link to={`/projects/${p.id}`} key={p.id} className="list-row"><div><b>{p.name}</b><small className="muted">{p.tasks_done}/{p.tasks_total} задач</small></div><PriorityBadge v={p.priority} /></Link>
          ))}
        </div>
        <div className="card">
          <h3>Последние действия команды</h3>
          {d.activities.length === 0 ? <Empty text="Действий пока нет" /> : d.activities.map((a) => (
            <div key={a.id} className="activity"><i /><div><span><b>{a.user_name}</b> {a.text}</span><small className="muted">{a.project_name} · {fmtTime(a.created_at)}</small></div></div>
          ))}
        </div>
      </div>
    </>
  );
}
