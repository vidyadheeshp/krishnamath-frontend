import { ArrowDownRight, ArrowUpRight, Layers, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import PageHeader from '../components/PageHeader';
import PeriodFilter from '../components/PeriodFilter';
import StatCard from '../components/StatCard';
import TallyExportButton from '../components/TallyExportButton';
import { EXPENSE_CATEGORIES, EXPENSE_COLORS, expenseCategoryLabel } from '../constants/expenseCategories';
import { ALL_CATEGORIES, CATEGORY_COLORS, categoryKey } from '../constants/paymentCategories';
import usePeriod from '../hooks/usePeriod';
import { formatCompactCurrency, formatCurrency, monthLabel } from '../utils/format';

const COLORS = { debit: '#e11d48', profit: '#0f172a' };

const profitClass = (value) => (value < 0 ? 'text-rose-600' : 'text-emerald-600');

function BreakdownList({ title, rows, labelKey, total, color = '#4f46e5', formatLabel = (value) => value }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <div className="mt-4 space-y-4">
        {rows.length === 0 ? <p className="text-sm text-slate-500">—</p> : null}
        {rows.map((row) => {
          const share = total > 0 ? (row.amount / total) * 100 : 0;
          return (
            <div key={row[labelKey]}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">{formatLabel(row[labelKey])}</span>
                <span className="text-slate-500">
                  <span className="font-semibold text-ink">{formatCurrency(row.amount)}</span> · {share.toFixed(0)}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function FinanceOverviewPage() {
  const { t, i18n } = useTranslation();
  const { year, setPeriod } = usePeriod();
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    api
      .get('/finance/overview', { params: { year } })
      .then((response) => {
        if (!cancelled) setData(response.data.data);
      })
      .catch((error) => toast.error(error.response?.data?.message || t('finance.loadFailed')));

    return () => {
      cancelled = true;
    };
  }, [year, t]);

  const chartData = useMemo(
    () =>
      (data?.months || []).map((entry) => ({
        ...entry,
        ...entry.categories,
        label: monthLabel(year, Number(entry.month.slice(5)), i18n.language),
      })),
    [data, year, i18n.language],
  );

  const totals = data?.totals || { credits: 0, debits: 0, profit: 0, entries: 0, expenses: 0 };
  const margin = totals.credits > 0 ? (totals.profit / totals.credits) * 100 : 0;
  const categories = data?.categories || ALL_CATEGORIES.map((category) => ({ category, amount: 0, count: 0 }));
  const debitCategories = data?.expenseCategories || EXPENSE_CATEGORIES.map((category) => ({ category, amount: 0, count: 0 }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('finance.overviewTitle')}
        description={t('finance.overviewDescription')}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <PeriodFilter year={year} years={data?.availableYears} onChange={setPeriod} allowAllMonths={false} />
            <TallyExportButton year={year} />
            <TallyExportButton year={year} kind="expenditure" />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('finance.credits')} value={totals.credits} currency icon={ArrowUpRight} tone="green" hint={t('finance.creditsHint')} />
        <StatCard label={t('finance.debits')} value={totals.debits} currency icon={ArrowDownRight} tone="red" hint={t('finance.debitsHint')} />
        <StatCard
          label={t('finance.profit')}
          value={totals.profit}
          currency
          icon={TrendingUp}
          tone={totals.profit < 0 ? 'red' : 'brand'}
          hint={`${t('finance.margin')}: ${margin.toFixed(1)}%`}
        />
        <StatCard label={t('finance.receiptEntries')} value={totals.entries} icon={Layers} tone="earthy" hint={`${totals.expenses} ${t('finance.expenseEntries')}`} />
      </div>

      <section aria-label={t('finance.creditsByCategory')}>
        <h2 className="mb-3 text-base font-semibold text-ink">{t('finance.creditsByCategory')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((item) => {
            const share = totals.credits > 0 ? (item.amount / totals.credits) * 100 : 0;
            return (
              <article key={item.category} className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
                <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[item.category] }} aria-hidden="true" />
                  {t(categoryKey(item.category))}
                </p>
                <p className="mt-2 text-xl font-semibold tracking-tight text-ink">{formatCurrency(item.amount)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.count} {t('receipts.entries')} · {share.toFixed(0)}%
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-label={t('finance.debitsByCategory')}>
        <h2 className="mb-3 text-base font-semibold text-ink">{t('finance.debitsByCategory')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {debitCategories.map((item) => {
            const share = totals.debits > 0 ? (item.amount / totals.debits) * 100 : 0;
            return (
              <article key={item.category} className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
                <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: EXPENSE_COLORS[item.category] || '#64748b' }} aria-hidden="true" />
                  {expenseCategoryLabel(t, item.category)}
                </p>
                <p className="mt-2 text-xl font-semibold tracking-tight text-ink">{formatCurrency(item.amount)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.count} {t('receipts.entries')} · {share.toFixed(0)}%
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-ink">{t('finance.monthlyTrend')}</h2>
          <p className="text-sm text-slate-500">{t('finance.monthlyTrendHint')}</p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} fontSize={12} tickFormatter={formatCompactCurrency} width={64} />
              <Tooltip formatter={(value) => formatCurrency(value)} cursor={{ fill: '#f1f5f9' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              {ALL_CATEGORIES.map((category, index) => (
                <Bar
                  key={category}
                  dataKey={category}
                  stackId="credits"
                  name={t(categoryKey(category))}
                  fill={CATEGORY_COLORS[category]}
                  maxBarSize={28}
                  radius={index === ALL_CATEGORIES.length - 1 ? [4, 4, 0, 0] : 0}
                />
              ))}
              <Bar dataKey="debits" name={t('finance.debits')} fill={COLORS.debit} radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Line dataKey="profit" name={t('finance.profit')} stroke={COLORS.profit} strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-ink">{t('finance.monthwiseStatement')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">{t('finance.month')}</th>
                {ALL_CATEGORIES.map((category) => (
                  <th key={category} className="whitespace-nowrap px-4 py-3 text-right">
                    {t(categoryKey(category))}
                  </th>
                ))}
                <th className="whitespace-nowrap px-4 py-3 text-right">{t('finance.credits')}</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">{t('finance.debits')}</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">{t('finance.profit')}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chartData.map((row) => (
                <tr key={row.month} className="hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">
                    {monthLabel(year, Number(row.month.slice(5)), i18n.language, 'long')}
                  </td>
                  {ALL_CATEGORIES.map((category) => (
                    <td key={category} className="px-4 py-3 text-right text-slate-600">
                      {row.categories[category] ? formatCurrency(row.categories[category]) : '-'}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(row.credits)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(row.debits)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${profitClass(row.profit)}`}>{formatCurrency(row.profit)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/finance/payments?year=${year}&month=${Number(row.month.slice(5))}`}
                      className="whitespace-nowrap text-xs font-semibold text-brand hover:underline"
                    >
                      {t('finance.viewDetails')}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-semibold text-ink">
              <tr>
                <td className="whitespace-nowrap px-4 py-3">{t('finance.total')} {year}</td>
                {categories.map((item) => (
                  <td key={item.category} className="px-4 py-3 text-right">
                    {formatCurrency(item.amount)}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">{formatCurrency(totals.credits)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(totals.debits)}</td>
                <td className={`px-4 py-3 text-right ${profitClass(totals.profit)}`}>{formatCurrency(totals.profit)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-ink">{t('finance.monthwiseDebits')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">{t('finance.month')}</th>
                {EXPENSE_CATEGORIES.map((category) => (
                  <th key={category} className="whitespace-nowrap px-4 py-3 text-right">
                    {expenseCategoryLabel(t, category)}
                  </th>
                ))}
                <th className="whitespace-nowrap px-4 py-3 text-right">{t('finance.debits')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chartData.map((row) => (
                <tr key={row.month} className="hover:bg-slate-50/70">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">
                    {monthLabel(year, Number(row.month.slice(5)), i18n.language, 'long')}
                  </td>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <td key={category} className="px-4 py-3 text-right text-slate-600">
                      {row.debitCategories?.[category] ? formatCurrency(row.debitCategories[category]) : '-'}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-medium text-slate-800">{formatCurrency(row.debits)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-semibold text-ink">
              <tr>
                <td className="whitespace-nowrap px-4 py-3">{t('finance.total')} {year}</td>
                {EXPENSE_CATEGORIES.map((category) => (
                  <td key={category} className="px-4 py-3 text-right">
                    {formatCurrency(debitCategories.find((item) => item.category === category)?.amount ?? 0)}
                  </td>
                ))}
                <td className="px-4 py-3 text-right">{formatCurrency(totals.debits)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <BreakdownList title={t('finance.byPaymentMode')} rows={data?.paymentModes || []} labelKey="paymentMode" total={totals.credits} />
        <BreakdownList title={t('finance.byExpenseCategory')} rows={(data?.expenseCategories || []).filter((row) => row.amount > 0)} labelKey="category" total={totals.debits} color="#e11d48" formatLabel={(value) => expenseCategoryLabel(t, value)} />
      </div>
    </div>
  );
}
