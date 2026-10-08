import { Ban, FileText, Pencil, Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import CategoryBadge from '../components/CategoryBadge';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import PeriodFilter from '../components/PeriodFilter';
import { CATEGORIES, CATEGORY_COLORS, RECEIPT_CATEGORIES, categoryKey } from '../constants/paymentCategories';
import usePeriod from '../hooks/usePeriod';
import { formatCurrency, formatDate, localeName } from '../utils/format';
import { openReceipt, receiptToDocument } from '../utils/generateReceipt';

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = (category = CATEGORIES.ANNADANA_SEVA) => ({
  category,
  receiptDate: today(),
  devoteeName: '',
  mobileNumber: '',
  amount: '',
  paymentMode: 'Cash',
  paymentReferenceNumber: '',
  notes: '',
});

const inputClass =
  'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20';
const selectClass =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20';

export default function ReceiptsPage() {
  const { t, i18n } = useTranslation();
  const { year, month, setPeriod } = usePeriod();
  const [category, setCategory] = useState('');
  const [receipts, setReceipts] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [editing, setEditing] = useState(null); // null | 'new' | receipt
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, index) => current - index);
  }, []);

  const loadReceipts = async () => {
    try {
      const response = await api.get('/receipts', { params: { year, month: month || undefined, category: category || undefined } });
      setReceipts(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || t('receipts.loadFailed'));
    }
  };

  useEffect(() => {
    loadReceipts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, category]);

  useEffect(() => {
    api
      .get('/metadata/paymentModes', { showLoader: false })
      .then((response) => setPaymentModes(response.data.data.filter((mode) => mode.enabled)))
      .catch(() => {});
  }, []);

  const confirmed = receipts.filter((receipt) => receipt.status !== 'cancelled');
  const totals = RECEIPT_CATEGORIES.map((key) => ({
    key,
    amount: confirmed.filter((receipt) => receipt.category === key).reduce((sum, receipt) => sum + receipt.amount, 0),
    count: confirmed.filter((receipt) => receipt.category === key).length,
  }));

  const isHundi = form.category === CATEGORIES.HUNDI_COLLECTION;
  const isNew = editing === 'new';

  const openCreate = (key) => {
    setForm(emptyForm(key));
    setEditing('new');
  };

  const openEdit = (receipt) => {
    setForm({
      category: receipt.category,
      receiptDate: receipt.receiptDate,
      devoteeName: receipt.devoteeName,
      mobileNumber: receipt.mobileNumber,
      amount: String(receipt.amount),
      paymentMode: receipt.paymentMode,
      paymentReferenceNumber: receipt.paymentReferenceNumber,
      notes: receipt.notes,
    });
    setEditing(receipt);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (isNew) {
        const response = await api.post('/receipts', form);
        toast.success(t('receipts.recorded', { number: response.data.data.receiptNumber }));
      } else {
        const { category: _category, ...changes } = form;
        void _category;
        await api.put(`/receipts/${editing.id}`, changes);
        toast.success(t('receipts.updated'));
      }
      setEditing(null);
      loadReceipts();
    } catch (error) {
      toast.error(error.response?.data?.message || t('receipts.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (receipt) => {
    if (!window.confirm(t('receipts.confirmCancel', { number: receipt.receiptNumber }))) return;

    try {
      await api.delete(`/receipts/${receipt.id}`);
      toast.success(t('receipts.cancelled'));
      loadReceipts();
    } catch (error) {
      toast.error(error.response?.data?.message || t('receipts.saveFailed'));
    }
  };

  const columns = [
    { key: 'receiptNumber', header: t('finance.receipt'), render: (value) => <span className="whitespace-nowrap font-mono text-xs">{value}</span> },
    { key: 'receiptDate', header: t('common.date'), render: (value) => <span className="whitespace-nowrap">{formatDate(value)}</span> },
    {
      key: 'category',
      header: t('receipts.category'),
      render: (value) => <CategoryBadge category={value} />,
      searchValue: (row) => t(categoryKey(row.category)),
      sortValue: (row) => t(categoryKey(row.category)),
    },
    { key: 'devoteeName', header: t('finance.devotee'), render: (value) => value || '-' },
    { key: 'paymentMode', header: t('common.paymentMode') },
    { key: 'amount', header: t('common.amount'), render: (value) => <span className="font-semibold text-ink">{formatCurrency(value)}</span> },
    { key: 'status', header: t('common.status') },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (_value, row) =>
        row.status === 'cancelled' ? null : (
          <div className="flex flex-wrap gap-2">
            {row.category !== CATEGORIES.HUNDI_COLLECTION ? (
              <button
                type="button"
                onClick={() => openReceipt(receiptToDocument(row))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                {t('common.viewReceipt')}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => openEdit(row)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              {t('common.edit')}
            </button>
            <button
              type="button"
              onClick={() => handleCancel(row)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
            >
              <Ban className="h-3.5 w-3.5" aria-hidden="true" />
              {t('receipts.cancel')}
            </button>
          </div>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('receipts.title')}
        description={t('receipts.description')}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <PeriodFilter year={year} month={month} years={years} onChange={setPeriod} />
            <select aria-label={t('receipts.category')} value={category} onChange={(event) => setCategory(event.target.value)} className={selectClass}>
              <option value="">{t('receipts.allCategories')}</option>
              {RECEIPT_CATEGORIES.map((key) => (
                <option key={key} value={key}>
                  {t(categoryKey(key))}
                </option>
              ))}
            </select>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {totals.map((item) => (
          <article key={item.key} className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[item.key] }} aria-hidden="true" />
                  {t(categoryKey(item.key))}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{formatCurrency(item.amount)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.count} {t('receipts.entries')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => openCreate(item.key)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-dark"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                {t('receipts.record')}
              </button>
            </div>
          </article>
        ))}
      </div>

      <DataTable columns={columns} rows={receipts.map((receipt) => ({ ...receipt, _search: [receipt.mobileNumber, receipt.notes, receipt.paymentReferenceNumber].filter(Boolean).join(' ') }))} emptyText={t('receipts.empty')} searchPlaceholder={t('receipts.searchPlaceholder')} />

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4">
          <div className="my-8 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">
                  {isNew ? t('receipts.recordTitle') : t('receipts.editTitle')}
                </h2>
                <div className="mt-2">
                  <CategoryBadge category={form.category} />
                </div>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label={t('common.close')}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {isNew ? (
              <div className="mb-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('receipts.category')}>
                {RECEIPT_CATEGORIES.map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={form.category === key}
                    onClick={() => setForm({ ...form, category: key })}
                    className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                      form.category === key ? 'border-brand bg-indigo-50 text-brand' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t(categoryKey(key))}
                  </button>
                ))}
              </div>
            ) : null}

            <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                {t('common.date')}
                <input className={inputClass} type="date" value={form.receiptDate} onChange={(e) => setForm({ ...form, receiptDate: e.target.value })} required />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                {t('common.amount')} (₹)
                <input className={inputClass} type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              </label>

              {!isHundi ? (
                <>
                  <label className="block text-sm font-medium text-slate-700">
                    {t('finance.devotee')}
                    <input className={inputClass} value={form.devoteeName} onChange={(e) => setForm({ ...form, devoteeName: e.target.value })} required maxLength={120} />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    {t('bookings.mobileNumber')}
                    <input className={inputClass} value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} inputMode="tel" />
                  </label>
                </>
              ) : null}

              <label className="block text-sm font-medium text-slate-700">
                {t('common.paymentMode')}
                <select className={inputClass} value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })} required>
                  {(paymentModes.length ? paymentModes : [{ id: 'cash', name: 'Cash' }]).map((mode) => (
                    <option key={mode.id} value={mode.name}>
                      {localeName(mode, i18n.language)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-slate-700">
                {t('finance.reference')}
                <input className={inputClass} value={form.paymentReferenceNumber} onChange={(e) => setForm({ ...form, paymentReferenceNumber: e.target.value })} maxLength={100} />
              </label>

              <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                {isHundi ? t('receipts.hundiNotes') : t('common.notes')}
                <textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} maxLength={1000} />
              </label>

              <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
                <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={saving} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60">
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
