import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTranslation } from 'react-i18next';

import { formatCompactCurrency, formatCurrency, localeName } from '../utils/format';

// Bookings (green), expenditure (red), net (indigo) - matches the finance dashboard.
const REVENUE_COLORS = ['#059669', '#e11d48', '#4f46e5'];

const PIE_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];

export default function DashboardCharts({ revenue = [], popularSevas = [] }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">{t('dashboard.revenueAndSpending')}</h2>
            <p className="text-sm text-slate-500">{t('dashboard.revenueSubtitle')}</p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} fontSize={12} tickFormatter={formatCompactCurrency} width={64} />
              <Tooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {revenue.map((entry, index) => (
                  <Cell key={entry.label} fill={REVENUE_COLORS[index % REVENUE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <div>
          <h2 className="text-lg font-semibold text-ink">{t('dashboard.popularSevas')}</h2>
          <p className="text-sm text-slate-500">{t('dashboard.popularSevasSubtitle')}</p>
        </div>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={popularSevas} dataKey="bookings" nameKey="name" innerRadius={50} outerRadius={85}>
                {popularSevas.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value, name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 space-y-2">
          {popularSevas.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                />
                <span className="text-sm text-teak">{localeName(item, lang)}</span>
              </div>
              <span className="text-sm font-semibold text-ink">{item.bookings} {t('dashboard.bookingsLabel')}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
