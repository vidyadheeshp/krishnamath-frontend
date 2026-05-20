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

import { formatCurrency, localeName } from '../utils/format';

const PIE_COLORS = [
  '#ad4c34', '#f2b84b', '#2e7d5e', '#6b4c9a', '#1976a8',
  '#c0392b', '#e67e22', '#27ae60', '#8e44ad', '#2980b9',
  '#d35400', '#16a085', '#7f8c8d', '#c0392b', '#f39c12',
];

export default function DashboardCharts({ revenue = [], popularSevas = [] }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
      <section className="rounded-[1.75rem] border border-white/70 bg-white p-6 shadow-card">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl text-ink">{t('dashboard.revenueAndSpending')}</h2>
            <p className="text-sm text-teak/70">{t('dashboard.revenueSubtitle')}</p>
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eadfcd" />
              <XAxis dataKey="label" stroke="#5d4030" />
              <YAxis stroke="#5d4030" tickFormatter={(value) => `₹${value / 1000}k`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#ad4c34" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="rounded-[1.75rem] border border-white/70 bg-white p-6 shadow-card">
        <div>
          <h2 className="font-serif text-2xl text-ink">{t('dashboard.popularSevas')}</h2>
          <p className="text-sm text-teak/70">{t('dashboard.popularSevasSubtitle')}</p>
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
            <div key={item.name} className="flex items-center justify-between rounded-2xl bg-sandal/55 px-4 py-3">
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
