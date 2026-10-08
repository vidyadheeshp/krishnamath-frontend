import { Ban, Layers, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import CategoryBadge from '../components/CategoryBadge';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import PeriodFilter from '../components/PeriodFilter';
import StatCard from '../components/StatCard';
import TallyExportButton from '../components/TallyExportButton';
import { ALL_CATEGORIES, CATEGORY_COLORS, categoryKey } from '../constants/paymentCategories';
import usePeriod from '../hooks/usePeriod';
import { formatCurrency, formatDate } from '../utils/format';

export default function FinancePaymentsPage() {
  const { t } = useTranslation();
  const { year, month, setPeriod } = usePeriod();
  const [category, setCategory] = useState('');
  const [data, setData] = useState(null);
  const [years, setYears] = useState([]);

  useEffect(() => {
    api
      .get('/finance/overview', { params: { year }, showLoader: false })
      .then((response) => setYears(response.data.data.availableYears))
      .catch(() => {});
  }, [year]);

  useEffect(() => {
    let cancelled = false;

    api
      .get('/finance/payments', { params: { year, month: month || undefined, category: category || undefined } })
      .then((response) => {
        if (!cancelled) setData(response.data.data);
      })
      .catch((error) => toast.error(error.response?.data?.message || t('finance.loadFailed')));

    return () => {
      cancelled = true;
    };
  }, [year, month, category, t]);

  const columns = [
    { key: 'receiptNumber', header: t('finance.receipt'), render: (value) => <span className="whitespace-nowrap font-mono text-xs">{value}</span> },
    { key: 'date', header: t('common.date'), render: (value) => <span className="whitespace-nowrap">{formatDate(value)}</span> },
    {
      key: 'category',
      header: t('receipts.category'),
      render: (value) => <CategoryBadge category={value} />,
      searchValue: (row) => t(categoryKey(row.category)),
      sortValue: (row) => t(categoryKey(row.category)),
    },
    { key: 'devotee', header: t('finance.devotee'), render: (value) => value || '-' },
    { key: 'particulars', header: t('finance.particulars'), render: (value) => value || '-' },
    { key: 'reference', header: t('finance.reference'), render: (value) => value || '-' },
    {
      key: 'amount',
      header: t('common.amount'),
      render: (value) => <span className="font-semibold text-ink">{formatCurrency(value)}</span>,
    },
  ];

  const groups = data?.groups || [];
  const categories = data?.categories || ALL_CATEGORIES.map((key) => ({ category: key, amount: 0, count: 0 }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('finance.paymentsTitle')}
        description={t('finance.paymentsDescription')}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <PeriodFilter year={year} month={month} years={years} onChange={setPeriod} />
            <TallyExportButton year={year} month={month} category={category} />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t('finance.totalCollected')} value={data?.totalCollected || 0} currency icon={Wallet} tone="green" />
        <StatCard label={t('finance.receiptEntries')} value={data?.totalEntries || 0} icon={Layers} tone="brand" />
        <StatCard label={t('finance.cancelledEntries')} value={data?.cancelledEntries || 0} icon={Ban} tone="red" hint={t('finance.cancelledHint')} />
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label={t('receipts.category')}>
        <button
          type="button"
          role="tab"
          aria-selected={category === ''}
          onClick={() => setCategory('')}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
            category === '' ? 'border-brand bg-indigo-50 text-brand' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          {t('receipts.allCategories')}
        </button>
        {categories.map((item) => (
          <button
            key={item.category}
            type="button"
            role="tab"
            aria-selected={category === item.category}
            onClick={() => setCategory(item.category)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              category === item.category ? 'border-brand bg-indigo-50 text-brand' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[item.category] }} aria-hidden="true" />
            {t(categoryKey(item.category))}
            <span className="text-xs font-semibold text-slate-500">{formatCurrency(item.amount)}</span>
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-sm text-slate-500">
          {t('finance.noBookings')}
        </div>
      ) : null}

      {groups.map((group) => {
        const share = data.totalCollected > 0 ? (group.total / data.totalCollected) * 100 : 0;

        return (
          <section key={group.paymentMode} className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold text-ink">{group.paymentMode}</h2>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                  {group.count} {t('finance.entriesLower')}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                <span className="text-lg font-semibold text-ink">{formatCurrency(group.total)}</span> · {share.toFixed(0)}% {t('finance.ofTotal')}
              </p>
            </div>
            <DataTable columns={columns} rows={group.entries.map((entry) => ({ ...entry, id: entry.key }))} />
          </section>
        );
      })}
    </div>
  );
}
