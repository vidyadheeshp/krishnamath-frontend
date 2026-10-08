const STYLES = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  confirmed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  completed: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  inactive: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  disabled: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

const DEFAULT_STYLE = 'bg-slate-100 text-slate-600 ring-slate-500/20';

export default function StatusBadge({ value }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${
        STYLES[value] || DEFAULT_STYLE
      }`}
    >
      {String(value || 'n/a').replace('-', ' ')}
    </span>
  );
}
