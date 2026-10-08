import { formatCurrency } from '../utils/format';

const TONES = {
  plain: 'bg-slate-100 text-slate-600',
  brand: 'bg-indigo-50 text-indigo-600',
  warm: 'bg-amber-50 text-amber-600',
  earthy: 'bg-sky-50 text-sky-600',
  green: 'bg-emerald-50 text-emerald-600',
  red: 'bg-rose-50 text-rose-600',
};

export default function StatCard({ label, value, tone = 'plain', currency = false, icon: Icon, hint }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon ? (
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONES[tone] || TONES.plain}`}>
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">{currency ? formatCurrency(value) : value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </article>
  );
}
