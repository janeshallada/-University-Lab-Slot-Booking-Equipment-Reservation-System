import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function Reserve() {
  const { id } = useParams();
  const nav = useNavigate();
  const [lab, setLab] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [slots, setSlots] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [slotId, setSlotId] = useState('');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [picked, setPicked] = useState({}); // {equipmentId: qty}
  const [err, setErr] = useState(''); const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const d = await api(`/labs/${id}`); setLab(d.lab); setEquipment(d.equipment);
    })().catch((e) => setErr(e.message));
  }, [id]);

  useEffect(() => {
    if (!date) return;
    api(`/slots?lab_id=${id}&date=${date}`).then((d) => setSlots(d.slots)).catch((e) => setErr(e.message));
  }, [id, date]);

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setOk(''); setBusy(true);
    try {
      const equipmentList = Object.entries(picked)
        .filter(([, q]) => Number(q) > 0)
        .map(([eid, q]) => ({ equipment_id: Number(eid), quantity: Number(q) }));
      await api('/reservations', {
        method: 'POST',
        body: {
          slot_id: Number(slotId),
          project_title: title,
          project_details: details || null,
          equipment: equipmentList,
        },
      });
      setOk('Reservation created!');
      setTimeout(() => nav('/history'), 700);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  if (!lab) return <div className="p-8 text-slate-500">Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold">{lab.name}</h1>
      <p className="text-slate-500 mb-4">{lab.location} · {lab.subject}</p>

      <form onSubmit={submit} className="card p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="label">Slot</label>
            <select className="input" value={slotId} onChange={(e) => setSlotId(e.target.value)} required>
              <option value="">Select a slot…</option>
              {slots.map((s) => (
                <option key={s.id} value={s.id}>{s.start_time} – {s.end_time} (cap {s.max_capacity})</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Project title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
        </div>
        <div>
          <label className="label">Project details</label>
          <textarea className="input" rows="3" value={details} onChange={(e) => setDetails(e.target.value)} maxLength={2000} />
        </div>
        <div>
          <label className="label">Required equipment (optional)</label>
          {equipment.length === 0 && <p className="text-sm text-slate-500">No equipment registered for this lab.</p>}
          <div className="space-y-2">
            {equipment.map((eq) => (
              <div key={eq.id} className="flex items-center justify-between border border-slate-200 rounded-md px-3 py-2">
                <div>
                  <p className="font-medium text-sm">{eq.name}</p>
                  <p className="text-xs text-slate-500">{eq.category} · total {eq.total_quantity}</p>
                </div>
                <input
                  type="number" min="0" max={eq.total_quantity}
                  className="input w-24"
                  value={picked[eq.id] || ''}
                  onChange={(e) => setPicked({ ...picked, [eq.id]: e.target.value })}
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>
        {err && <div className="text-red-600 text-sm">{err}</div>}
        {ok && <div className="text-emerald-600 text-sm">{ok}</div>}
        <button className="btn-primary" disabled={busy}>{busy ? 'Reserving…' : 'Reserve slot'}</button>
      </form>
    </div>
  );
}
