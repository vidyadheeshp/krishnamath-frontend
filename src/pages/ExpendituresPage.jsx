import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { EXPENSE_CATEGORIES, expenseCategoryLabel } from '../constants/expenseCategories';
import { formatCurrency, formatDate } from '../utils/format';

const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card'];

const makeInitialForm = () => ({
  expenseTitle: '',
  expenseCategory: 'Maintenance',
  expenseAmount: '',
  expenseDate: new Date().toISOString().slice(0, 10),
  paymentMode: 'Cash',
  vendorDetails: '',
  notes: '',
});

export default function ExpendituresPage() {
  const [expenditures, setExpenditures] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(makeInitialForm());
  const { t } = useTranslation();

  const loadExpenditures = async () => {
    try {
      const response = await api.get('/expenditures');
      setExpenditures(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load expenditures');
    }
  };

  useEffect(() => {
    loadExpenditures();
  }, []);

  const tableRows = useMemo(() => expenditures.map((exp) => ({ ...exp, _expenditure: exp })), [expenditures]);

  const columns = useMemo(
    () => [
      { key: 'slNo', header: t('common.slNo') },
      { key: 'expenseTitle', header: t('expenditures.expense') },
      {
        key: 'expenseCategory',
        header: t('common.category'),
        render: (value) => expenseCategoryLabel(t, value),
        searchValue: (row) => expenseCategoryLabel(t, row.expenseCategory),
        sortValue: (row) => expenseCategoryLabel(t, row.expenseCategory),
      },
      { key: 'expenseAmount', header: t('common.amount'), render: (value) => formatCurrency(value) },
      { key: 'expenseDate', header: t('common.date'), render: (value) => formatDate(value) },
      { key: 'paymentMode', header: t('common.paymentMode') },
      { key: 'vendorDetails', header: t('expenditures.vendor') },
      {
        key: 'actions',
        header: t('common.actions'),
        render: (_, row) => (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleOpenEdit(row._expenditure)}
              className="rounded-xl border border-sandal px-3 py-1 text-xs font-semibold text-ink hover:bg-sandal/40"
            >
              {t('common.edit')}
            </button>
            <button
              type="button"
              onClick={() => handleDelete(row._expenditure)}
              className="rounded-xl border border-terracotta/40 px-3 py-1 text-xs font-semibold text-terracotta hover:bg-terracotta/10"
            >
              {t('common.delete')}
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(makeInitialForm());
    setIsModalOpen(true);
  };

  const handleOpenEdit = (expenditure) => {
    setEditingId(expenditure.id);
    setForm({
      expenseTitle: expenditure.expenseTitle,
      expenseCategory: expenditure.expenseCategory,
      expenseAmount: expenditure.expenseAmount,
      expenseDate: expenditure.expenseDate,
      paymentMode: expenditure.paymentMode,
      vendorDetails: expenditure.vendorDetails || '',
      notes: expenditure.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (expenditure) => {
    if (!window.confirm(`Delete "${expenditure.expenseTitle}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/expenditures/${expenditure.id}`);
      toast.success('Expenditure deleted');
      loadExpenditures();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete expenditure');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        await api.put(`/expenditures/${editingId}`, form);
        toast.success('Expenditure updated');
      } else {
        await api.post('/expenditures', form);
        toast.success('Expenditure recorded');
      }
      setIsModalOpen(false);
      setEditingId(null);
      setForm(makeInitialForm());
      loadExpenditures();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save expenditure');
    }
  };

  const field = (name, label, type = 'text') => (
    <label key={name} className="block text-sm font-semibold text-teak">
      {label}
      <input
        name={name}
        type={type}
        value={form[name]}
        onChange={(e) => setForm((c) => ({ ...c, [name]: e.target.value }))}
        className="mt-1 w-full rounded-lg border border-sandal px-4 py-2.5 text-sm font-normal text-ink outline-none focus:border-teak"
        required={['expenseTitle', 'expenseAmount', 'expenseDate'].includes(name)}
      />
    </label>
  );

  const select = (name, label, options, optionLabel = (option) => option) => (
    <label key={name} className="block text-sm font-semibold text-teak">
      {label}
      <select
        name={name}
        value={form[name]}
        onChange={(e) => setForm((c) => ({ ...c, [name]: e.target.value }))}
        className="mt-1 w-full rounded-lg border border-sandal px-4 py-2.5 text-sm font-normal text-ink outline-none focus:border-teak"
      >
        {options.map((o) => <option key={o} value={o}>{optionLabel(o)}</option>)}
      </select>
    </label>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('expenditures.title')}
        description={t('expenditures.description')}
      />

      {/* Table card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{t('expenditures.allExpenditures')}</h2>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink/80"
          >
            + {t('expenditures.addExpenditure')}
          </button>
        </div>

        <DataTable columns={columns} rows={tableRows} emptyText={t('expenditures.emptyText')} searchPlaceholder={t('expenditures.searchPlaceholder')} />

      </div>

      {/* Add / Edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/45 px-4 py-8">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-ink">
                {editingId ? t('expenditures.editExpenditure') : t('expenditures.addExpenditure')}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="shrink-0 rounded-xl border border-sandal px-3 py-2 text-sm font-semibold text-ink hover:bg-sandal/40"
              >
                ✕ {t('common.close')}
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {field('expenseTitle', t('expenditures.expenseTitle'))}
                {select(
                  'expenseCategory',
                  t('common.category'),
                  // An older record may carry a category that is no longer on the list; keep it selectable.
                  EXPENSE_CATEGORIES.includes(form.expenseCategory) ? EXPENSE_CATEGORIES : [form.expenseCategory, ...EXPENSE_CATEGORIES],
                  (option) => expenseCategoryLabel(t, option),
                )}
                {field('expenseAmount', t('common.amount'), 'number')}
                {field('expenseDate', t('common.date'), 'date')}
                {select('paymentMode', t('common.paymentMode'), PAYMENT_MODES)}
                {field('vendorDetails', t('expenditures.vendorDetails'))}
              </div>
              <div className="mt-4">
                {field('notes', t('common.notes'))}
              </div>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-lg border border-sandal px-4 py-2.5 text-sm font-semibold text-ink hover:bg-sandal/40"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink/80"
                >
                  {editingId ? t('expenditures.saveChanges') : t('expenditures.saveExpenditure')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
