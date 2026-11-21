export default function Avatar({ user, size = 36 }) {
  const name = user?.full_name || user?.author_name || user?.username || '?';
  const src = user?.avatar || user?.author_avatar;
  const style = { width: size, height: size, fontSize: size * 0.4 };
  if (src) return <img className="avatar" style={style} src={src} alt={name} />;
  return <div className="avatar" style={style}>{name.trim().slice(0, 1).toUpperCase()}</div>;
}
