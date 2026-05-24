import { Link } from 'react-router-dom';

export default function LabCard({ lab }) {
  return (
    <div className="card p-5 flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">{lab.name}</h3>
          <p className="text-sm text-slate-500">{lab.location || '—'}</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-brand-50 text-brand-700">{lab.subject || 'General'}</span>
      </div>
      <p className="text-sm text-slate-600 line-clamp-2">{lab.description || 'No description.'}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-slate-500">Capacity: {lab.capacity}</span>
        <Link to={`/labs/${lab.id}/reserve`} className="btn-primary">Reserve</Link>
      </div>
    </div>
  );
}
