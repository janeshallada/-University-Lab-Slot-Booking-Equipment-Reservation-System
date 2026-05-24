import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import DataTable from '../components/DataTable.jsx';
import Pagination from '../components/Pagination.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

export default function History() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ reservations: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [status, setStatus] = useState('');
  const pageSize = 10;

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const qs = new URLSearchParams({ page, page_size: pageSize });
      if (status) qs.set('status', status);
      const d = await api('/reservations?' + qs.toString());
      setData(d);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [page, status]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-1">My reservations</h1>
      <p className="text-slate-500 mb-4">Track the status of your lab bookings.</p>
      <div className="card p-3 mb-3 flex flex-wrap gap-2 items-center">
        <label className="text-sm text-slate-600">Status:</label>
        <select className="input max-w-xs" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
          <option value="">All</option>
          {['Pending', 'Approved', 'Active', 'Completed', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      {loading ? <div className="text-slate-500">Loading…</div>
        : err ? <div className="text-red-600">{err}</div>
        : <>
          <DataTable
            columns={[
              { key: 'project_title', label: 'Project' },
              { key: 'lab_name', label: 'Lab' },
              { key: 'slot_date', label: 'Date', render: (r) => `${r.slot_date} ${r.start_time}–${r.end_time}` },
              { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            ]}
            rows={data.reservations}
            empty="You have no reservations yet."
          />
          <Pagination page={page} pageSize={pageSize} total={data.total} onChange={setPage} />
        </>}
    </div>
  );
}
