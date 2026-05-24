import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import LabCard from '../components/LabCard.jsx';

export default function Labs() {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (subject) params.set('subject', subject);
      const d = await api('/labs?' + params.toString());
      setLabs(d.labs);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Laboratories</h1>
      <p className="text-slate-500 mb-4">Browse labs and reserve a slot.</p>
      <div className="card p-4 mb-4 grid sm:grid-cols-3 gap-3">
        <input className="input" placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <input className="input" placeholder="Subject (e.g. Physics)" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <button className="btn-primary" onClick={load}>Search</button>
      </div>
      {loading && <div className="text-slate-500">Loading…</div>}
      {err && <div className="text-red-600">{err}</div>}
      {!loading && !err && labs.length === 0 && <div className="card p-8 text-center text-slate-500">No labs found.</div>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {labs.map((l) => <LabCard key={l.id} lab={l} />)}
      </div>
    </div>
  );
}
