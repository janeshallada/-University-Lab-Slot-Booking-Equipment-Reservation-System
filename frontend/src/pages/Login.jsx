import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('student@uni.edu');
  const [password, setPassword] = useState('student123');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setLoading(true);
    try { await login(email, password); nav('/'); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={submit} className="card w-full max-w-md p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-500">Sign in to reserve labs and equipment.</p>
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button className="btn-primary w-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        <p className="text-xs text-slate-500 text-center">
          No account? <Link to="/register" className="text-brand-600 hover:underline">Register</Link>
        </p>
        <div className="text-xs text-slate-400 border-t border-slate-100 pt-3">
          <p className="font-medium text-slate-500 mb-1">Demo accounts</p>
          <p>admin@uni.edu / admin123</p>
          <p>assistant@uni.edu / assist123</p>
          <p>student@uni.edu / student123</p>
        </div>
      </form>
    </div>
  );
}
