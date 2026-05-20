import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { formatCurrency, formatDate } from '../utils/format';

const CATEGORIES = ['Maintenance', 'Utilities', 'Salaries', 'Events', 'Supplies', 'Miscellaneous'];
const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card'];
const PAGE_SIZE = 10;

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
  const [currentPage, setCurrentPage] = useState(1);
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

  const totalPages = Math.max(1, Math.ceil(expenditures.length / PAGE_SIZE));

  const tableRows = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return expenditures.slice(startIndex, startIndex + PAGE_SIZE).map((exp, index) => ({
      ...exp,
      slNo: startIndex + index + 1,
      _expenditure: exp,
    }));
  }, [expenditures, currentPage]);

  const columns = useMemo(
    () => [
      { key: 'slNo', header: t('common.slNo') },
      { key: 'expenseTitle', header: t('expenditures.expense') },
      { key: 'expenseCategory', header: t('common.category') },
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
        className="mt-1 w-full rounded-2xl border border-sandal px-4 py-2.5 text-sm font-normal text-ink outline-none focus:border-teak"
        required={['expenseTitle', 'expenseAmount', 'expenseDate'].includes(name)}
      />
    </label>
  );

  const select = (name, label, options) => (
    <label key={name} className="block text-sm font-semibold text-teak">
      {label}
      <select
        name={name}
        value={form[name]}
        onChange={(e) => setForm((c) => ({ ...c, [name]: e.target.value }))}
        className="mt-1 w-full rounded-2xl border border-sandal px-4 py-2.5 text-sm font-normal text-ink outline-none focus:border-teak"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
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
      <div className="rounded-[1.75rem] border border-white/70 bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl text-ink">{t('expenditures.allExpenditures')}</h2>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="rounded-2xl bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink/80"
          >
            + {t('expenditures.addExpenditure')}
          </button>
        </div>

        <DataTable columns={columns} rows={tableRows} emptyText={t('expenditures.emptyText')} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-teak">
            <span>
              {t('common.page')} {currentPage} {t('common.of')} {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="rounded-xl border border-sandal px-3 py-1.5 font-semibold disabled:opacity-40"
              >
                ← {t('common.prev')}
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="rounded-xl border border-sandal px-3 py-1.5 font-semibold disabled:opacity-40"
              >
                {t('common.next')} →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/45 px-4 py-8">
          <div className="w-full max-w-lg rounded-[1.75rem] border border-white/70 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-serif text-2xl text-ink">
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
                {select('expenseCategory', t('common.category'), CATEGORIES)}
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
                  className="flex-1 rounded-2xl border border-sandal px-4 py-2.5 text-sm font-semibold text-ink hover:bg-sandal/40"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink/80"
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
