import { Receipt, Tags } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import PeriodFilter from '../components/PeriodFilter';
import StatCard from '../components/StatCard';
import TallyExportButton from '../components/TallyExportButton';
import { EXPENSE_COLORS, expenseCategoryLabel } from '../constants/expenseCategories';
import usePeriod from '../hooks/usePeriod';
import { formatCurrency, formatDate } from '../utils/format';

export default function FinanceExpendituresPage() {
  const { t } = useTranslation();
  const { year, month, setPeriod } = usePeriod();
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
      .get('/finance/expenditures', { params: { year, month: month || undefined } })
      .then((response) => {
        if (!cancelled) setData(response.data.data);
      })
      .catch((error) => toast.error(error.response?.data?.message || t('finance.loadFailed')));

    return () => {
      cancelled = true;
    };
  }, [year, month, t]);

  const columns = [
    { key: 'expenseDate', header: t('common.date'), render: (value) => formatDate(value) },
    { key: 'expenseTitle', header: t('finance.expenseTitle') },
    {
      key: 'expenseCategory',
      header: t('common.category'),
      render: (value) => expenseCategoryLabel(t, value),
      searchValue: (row) => expenseCategoryLabel(t, row.expenseCategory),
      sortValue: (row) => expenseCategoryLabel(t, row.expenseCategory),
    },
    { key: 'vendorDetails', header: t('finance.vendor'), render: (value) => value || '-' },
    { key: 'paymentMode', header: t('common.paymentMode') },
    {
      key: 'expenseAmount',
      header: t('common.amount'),
      render: (value) => <span className="font-semibold text-ink">{formatCurrency(value)}</span>,
    },
  ];

  const byCategory = data?.byCategory || [];
  const topCategory = [...byCategory].sort((left, right) => right.amount - left.amount)[0];
  const hasTop = topCategory && topCategory.amount > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('finance.expendituresTitle')}
        description={t('finance.expendituresDescription')}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <PeriodFilter year={year} month={month} years={years} onChange={setPeriod} />
            <TallyExportButton year={year} month={month} kind="expenditure" />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t('finance.totalExpenditure')} value={data?.total || 0} currency icon={Receipt} tone="red" />
        <StatCard label={t('finance.expenseEntriesLabel')} value={data?.items?.length || 0} icon={Tags} tone="brand" />
        <StatCard label={t('finance.topCategory')} value={hasTop ? expenseCategoryLabel(t, topCategory.category) : '-'} icon={Tags} tone="warm" hint={hasTop ? formatCurrency(topCategory.amount) : undefined} />
      </div>

      {byCategory.length > 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-base font-semibold text-ink">{t('finance.byExpenseCategory')}</h2>
          <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {byCategory.map((row) => {
              const share = data.total > 0 ? (row.amount / data.total) * 100 : 0;
              return (
                <div key={row.category}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium text-slate-700">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: EXPENSE_COLORS[row.category] || '#64748b' }} aria-hidden="true" />
                      {expenseCategoryLabel(t, row.category)}
                    </span>
                    <span className="font-semibold text-ink">{formatCurrency(row.amount)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: EXPENSE_COLORS[row.category] || '#64748b' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <DataTable columns={columns} rows={data?.items || []} emptyText={t('finance.noExpenditures')} />
    </div>
  );
}
