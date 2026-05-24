import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import StatusBadge from '../components/StatusBadge.jsx';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api('/dashboard/labs').then(setData).catch((e) => setErr(e.message)); }, []);

  if (err) return <div className="p-8 text-red-600">{err}</div>;
  if (!data) return <div className="p-8 text-slate-500">Loading…</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lab analytics</h1>
        <p className="text-slate-500">Occupancy and equipment utilization across all labs.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {data.labs.map((lab) => (
          <div key={lab.id} className="card p-4">
            <h3 className="font-semibold">{lab.name}</h3>
            <p className="text-xs text-slate-500 mb-3">{lab.subject}</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="Slots" value={lab.stats.total_slots} />
              <Stat label="Active" value={lab.stats.active_reservations} />
              <Stat label="Occupancy" value={`${lab.stats.occupancy_pct}%`} />
            </div>
            {lab.equipment_utilization.length > 0 && (
              <div className="mt-4 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lab.equipment_utilization}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
                    <YAxis unit="%" />
                    <Tooltip />
                    <Bar dataKey="utilization_pct" fill="#3b6df0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Upcoming timeline</h2>
        <div className="card overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr><th className="text-left px-4 py-2">Lab</th><th className="text-left px-4 py-2">Slot</th><th className="text-left px-4 py-2">Project</th><th className="text-left px-4 py-2">Student</th><th className="text-left px-4 py-2">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.timeline.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-2">{t.lab_name}</td>
                  <td className="px-4 py-2">{t.slot_date} {t.start_time}–{t.end_time}</td>
                  <td className="px-4 py-2">{t.project_title}</td>
                  <td className="px-4 py-2">{t.user_name}</td>
                  <td className="px-4 py-2"><StatusBadge status={t.status} /></td>
                </tr>
              ))}
              {data.timeline.length === 0 && <tr><td colSpan="5" className="text-center text-slate-500 py-6">No upcoming reservations.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-md py-2">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
