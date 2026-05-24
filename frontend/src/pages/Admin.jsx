import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

export default function Admin() {
  const [labs, setLabs] = useState([]);
  const [tab, setTab] = useState('labs');
  const reload = () => api('/labs').then((d) => setLabs(d.labs));
  useEffect(() => { reload(); }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Admin</h1>
      <p className="text-slate-500 mb-4">Create labs, equipment, and slots.</p>
      <div className="flex gap-2 mb-4">
        {['labs', 'equipment', 'slots'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${tab === t ? 'bg-brand-600 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {tab === 'labs' && <LabsTab labs={labs} reload={reload} />}
      {tab === 'equipment' && <EquipmentTab labs={labs} />}
      {tab === 'slots' && <SlotsTab labs={labs} />}
    </div>
  );
}

function LabsTab({ labs, reload }) {
  const [form, setForm] = useState({ name: '', location: '', subject: '', capacity: 10, description: '' });
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      await api('/labs', { method: 'POST', body: { ...form, capacity: Number(form.capacity) } });
      setForm({ name: '', location: '', subject: '', capacity: 10, description: '' });
      reload();
    } catch (e) { setErr(e.message); }
  };
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <form className="card p-4 space-y-3" onSubmit={submit}>
        <h3 className="font-semibold">Create lab</h3>
        <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input" placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <input className="input" placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        <input className="input" type="number" min="1" placeholder="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required />
        <textarea className="input" placeholder="Description" rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="btn-primary">Create</button>
      </form>
      <div className="card p-4">
        <h3 className="font-semibold mb-2">Existing labs</h3>
        <ul className="divide-y divide-slate-100 text-sm">
          {labs.map((l) => <li key={l.id} className="py-2 flex justify-between"><span>{l.name}</span><span className="text-slate-500">{l.subject} · cap {l.capacity}</span></li>)}
        </ul>
      </div>
    </div>
  );
}

function EquipmentTab({ labs }) {
  const [form, setForm] = useState({ lab_id: '', name: '', category: '', total_quantity: 1, description: '' });
  const [list, setList] = useState([]);
  const [err, setErr] = useState('');
  const reload = () => api('/equipment').then((d) => setList(d.equipment));
  useEffect(() => { reload(); }, []);
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      await api('/equipment', { method: 'POST', body: { ...form, lab_id: Number(form.lab_id), total_quantity: Number(form.total_quantity) } });
      setForm({ lab_id: '', name: '', category: '', total_quantity: 1, description: '' });
      reload();
    } catch (e) { setErr(e.message); }
  };
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <form className="card p-4 space-y-3" onSubmit={submit}>
        <h3 className="font-semibold">Add equipment</h3>
        <select className="input" value={form.lab_id} onChange={(e) => setForm({ ...form, lab_id: e.target.value })} required>
          <option value="">Select lab…</option>
          {labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
        <input className="input" type="number" min="1" placeholder="Total quantity" value={form.total_quantity} onChange={(e) => setForm({ ...form, total_quantity: e.target.value })} required />
        <textarea className="input" rows="2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="btn-primary">Add</button>
      </form>
      <div className="card p-4">
        <h3 className="font-semibold mb-2">Inventory</h3>
        <ul className="divide-y divide-slate-100 text-sm max-h-96 overflow-auto">
          {list.map((e) => (
            <li key={e.id} className="py-2 flex justify-between">
              <span>{e.name} <span className="text-slate-500">({e.lab_name})</span></span>
              <span className="text-slate-500">{e.category} · {e.total_quantity}</span>
            </li>
          ))}
          {list.length === 0 && <li className="py-6 text-center text-slate-500">No equipment yet.</li>}
        </ul>
      </div>
    </div>
  );
}

function SlotsTab({ labs }) {
  const [form, setForm] = useState({ lab_id: '', slot_date: new Date().toISOString().slice(0, 10), start_time: '09:00', end_time: '11:00', max_capacity: 10 });
  const [list, setList] = useState([]);
  const [err, setErr] = useState('');
  const reload = () => api('/slots').then((d) => setList(d.slots));
  useEffect(() => { reload(); }, []);
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    try {
      await api('/slots', { method: 'POST', body: { ...form, lab_id: Number(form.lab_id), max_capacity: Number(form.max_capacity) } });
      reload();
    } catch (e) { setErr(e.message); }
  };
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <form className="card p-4 space-y-3" onSubmit={submit}>
        <h3 className="font-semibold">Create slot</h3>
        <select className="input" value={form.lab_id} onChange={(e) => setForm({ ...form, lab_id: e.target.value })} required>
          <option value="">Select lab…</option>
          {labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <input className="input" type="date" value={form.slot_date} onChange={(e) => setForm({ ...form, slot_date: e.target.value })} required />
        <div className="grid grid-cols-2 gap-2">
          <input className="input" type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} required />
          <input className="input" type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} required />
        </div>
        <input className="input" type="number" min="1" placeholder="Max capacity" value={form.max_capacity} onChange={(e) => setForm({ ...form, max_capacity: e.target.value })} required />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="btn-primary">Create</button>
      </form>
      <div className="card p-4">
        <h3 className="font-semibold mb-2">Upcoming slots</h3>
        <ul className="divide-y divide-slate-100 text-sm max-h-96 overflow-auto">
          {list.map((s) => (
            <li key={s.id} className="py-2 flex justify-between">
              <span>{s.lab_name}</span>
              <span className="text-slate-500">{s.slot_date} {s.start_time}–{s.end_time}</span>
            </li>
          ))}
          {list.length === 0 && <li className="py-6 text-center text-slate-500">No slots yet.</li>}
        </ul>
      </div>
    </div>
  );
}
