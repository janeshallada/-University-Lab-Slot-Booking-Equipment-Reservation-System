import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import DataTable from '../components/DataTable.jsx';
import Pagination from '../components/Pagination.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const STATUSES = ['Pending', 'Approved', 'Active', 'Completed', 'Cancelled'];

export default function AssistantDashboard() {
  const [data, setData] = useState({ reservations: [], total: 0 });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [student, setStudent] = useState('');
  const [labId, setLabId] = useState('');
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const pageSize = 10;

  useEffect(() => { api('/labs').then((d) => setLabs(d.labs)).catch(() => {}); }, []);

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const qs = new URLSearchParams({ page, page_size: pageSize });
      if (status) qs.set('status', status);
      if (student) qs.set('student', student);
      if (labId) qs.set('lab_id', labId);
      const d = await api('/reservations?' + qs.toString());
      setData(d);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [page, status, labId]);

  const updateStatus = async (r, newStatus) => {
    try {
      await api(`/reservations/${r.id}/status`, { method: 'PUT', body: { status: newStatus } });
      load();
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">Assistant dashboard</h1>
      <p className="text-slate-500 mb-4">Approve, activate, and close reservations.</p>
      <div className="card p-3 mb-3 grid sm:grid-cols-4 gap-2">
        <select className="input" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="input" value={labId} onChange={(e) => { setPage(1); setLabId(e.target.value); }}>
          <option value="">All labs</option>
          {labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <input className="input" placeholder="Student name…" value={student} onChange={(e) => setStudent(e.target.value)} />
        <button className="btn-primary" onClick={() => { setPage(1); load(); }}>Filter</button>
      </div>
      {loading ? <div className="text-slate-500">Loading…</div>
        : err ? <div className="text-red-600">{err}</div>
        : <>
          <DataTable
            columns={[
              { key: 'user_name', label: 'Student' },
              { key: 'project_title', label: 'Project' },
              { key: 'lab_name', label: 'Lab' },
              { key: 'slot', label: 'Slot', render: (r) => `${r.slot_date} ${r.start_time}–${r.end_time}` },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
              {
                key: 'actions', label: 'Update', render: (r) => (
                  <select className="input max-w-[140px]" value={r.status} onChange={(e) => updateStatus(r, e.target.value)}>
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                )
              },
            ]}
            rows={data.reservations}
            empty="No reservations match these filters."
          />
          <Pagination page={page} pageSize={pageSize} total={data.total} onChange={setPage} />
        </>}
    </div>
  );
}
