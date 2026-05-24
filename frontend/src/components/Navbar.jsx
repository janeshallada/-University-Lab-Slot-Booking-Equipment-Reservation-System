import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const linkCls = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  if (!user) return null;
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <Link to="/" className="font-bold text-lg text-brand-700">LabRes</Link>
        <nav className="flex gap-1 flex-wrap">
          <NavLink to="/labs" className={linkCls}>Labs</NavLink>
          {user.role === 'student' && <NavLink to="/history" className={linkCls}>My reservations</NavLink>}
          {(user.role === 'assistant' || user.role === 'admin') && (
            <>
              <NavLink to="/assistant" className={linkCls}>Assistant</NavLink>
              <NavLink to="/analytics" className={linkCls}>Analytics</NavLink>
            </>
          )}
          {user.role === 'admin' && <NavLink to="/admin" className={linkCls}>Admin</NavLink>}
        </nav>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600 hidden sm:inline">
            {user.name} · <span className="capitalize">{user.role}</span>
          </span>
          <button className="btn-secondary" onClick={() => { logout(); nav('/login'); }}>Logout</button>
        </div>
      </div>
    </header>
  );
}
