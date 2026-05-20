import { formatCurrency } from '../utils/format';

export default function StatCard({ label, value, tone = 'plain', currency = false }) {
  const toneMap = {
    plain: 'from-white to-sandal/80',
    warm: 'from-marigold/35 to-white',
    earthy: 'from-terracotta/20 to-white',
    green: 'from-moss/20 to-white',
  };

  return (
    <article className={`rounded-[1.75rem] border border-white/70 bg-gradient-to-br ${toneMap[tone]} p-5 shadow-card`}>
      <p className="text-sm text-teak/70">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-ink">{currency ? formatCurrency(value) : value}</p>
    </article>
  );
}
