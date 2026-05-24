const styles = {
  Pending: 'bg-amber-100 text-amber-800',
  Approved: 'bg-blue-100 text-blue-800',
  Active: 'bg-emerald-100 text-emerald-800',
  Completed: 'bg-slate-200 text-slate-700',
  Cancelled: 'bg-red-100 text-red-700',
};
export default function StatusBadge({ status }) {
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100'}`}>{status}</span>;
}
