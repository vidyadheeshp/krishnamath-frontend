import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { formatCurrency, localeName } from '../utils/format';


const initialForm = {
  name: '',
  nameKn: '',
  description: '',
  amount: 250,
  category: 'Daily',
  instructions: '',
  availabilityStatus: 'active',
};

export default function SevasPage() {
  const [sevas, setSevas] = useState([]);
  const [sevaCategories, setSevaCategories] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { t, i18n: i18nInst } = useTranslation();
  const lang = i18nInst.language;

  const loadSevas = async () => {
    try {
      const response = await api.get('/sevas');
      setSevas(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load sevas');
    }
  };

  useEffect(() => {
    loadSevas();
    api.get('/metadata/sevaCategories')
      .then((res) => setSevaCategories(res.data.data.filter((c) => c.enabled)))
      .catch(() => {});
  }, []);

  const handleOpenEdit = (seva) => {
    setForm({
      name: seva.name ?? '',
      nameKn: seva.nameKn ?? '',
      description: seva.description ?? '',
      amount: seva.amount ?? 250,
      category: seva.category ?? 'Daily',
      instructions: seva.instructions ?? '',
      availabilityStatus: seva.availabilityStatus ?? 'active',
    });
    setEditingId(seva.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (seva) => {
    if (!window.confirm(`Delete "${seva.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/sevas/${seva.id}`);
      toast.success('Seva deleted');
      loadSevas();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete seva');
    }
  };

  const columns = useMemo(
    () => [
      { key: 'slNo', header: t('common.slNo') },
      { key: 'name', header: t('sevas.sevaName'), render: (_value, row) => localeName(row, lang) },
      { key: 'category', header: t('common.category') },
      { key: 'amount', header: t('common.amount'), render: (value) => formatCurrency(value) },
      {
        key: 'id',
        header: t('common.actions'),
        render: (_value, row) => (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleOpenEdit(row)}
              className="rounded-lg border border-sandal px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sandal/40"
            >
              {t('common.edit')}
            </button>
            <button
              type="button"
              onClick={() => handleDelete(row)}
              className="rounded-lg bg-terracotta/10 px-3 py-1.5 text-xs font-semibold text-terracotta hover:bg-terracotta/20"
            >
              {t('common.delete')}
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, lang],
  );

  // Only active sevas are listed; the table searches the description and instructions too.
  const tableRows = useMemo(
    () =>
      sevas
        .filter((seva) => seva.availabilityStatus === 'active')
        .map((seva) => ({ ...seva, _search: [seva.nameKn, seva.description, seva.instructions].filter(Boolean).join(' ') })),
    [sevas],
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (editingId) {
        await api.put(`/sevas/${editingId}`, form);
        toast.success('Seva updated');
      } else {
        await api.post('/sevas', form);
        toast.success('Seva created');
      }
      setForm(initialForm);
      setEditingId(null);
      setIsModalOpen(false);
      loadSevas();
    } catch (error) {
      toast.error(error.response?.data?.message || (editingId ? 'Failed to update seva' : 'Failed to create seva'));
    }
  };

  const handleOpenModal = () => {
    setForm(initialForm);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(initialForm);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('sevas.title')}
        description={t('sevas.description')}
        action={
          <button
            type="button"
            onClick={handleOpenModal}
            className="rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            {t('sevas.addNewSeva')}
          </button>
        }
      />
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">{t('sevas.catalog')}</h2>
            <p className="mt-2 text-sm text-teak/80">
              {t('sevas.catalogSubtitle')}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <DataTable columns={columns} rows={tableRows} emptyText={t('sevas.emptyText')} searchPlaceholder={t('sevas.searchPlaceholder')} />
        </div>
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 px-4 py-6">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-ink">{editingId ? t('sevas.editSeva') : t('sevas.addNewSeva')}</h2>
                <p className="mt-1 text-xs text-teak/80">{editingId ? t('sevas.editDesc') : t('sevas.addDesc')}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-xl border border-sandal px-3 py-2 text-sm font-semibold text-ink"
              >
                {t('common.close')}
              </button>
            </div>

            <form className="mt-4" onSubmit={handleSubmit}>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ['name', t('sevas.sevaName')],
                  ['nameKn', t('sevas.sevaNameKn')],
                  ['description', t('sevas.description')],
                  ['instructions', t('sevas.instructions')],
                ].map(([name, label]) => (
                  <label key={name} className={`block text-sm font-semibold text-teak ${name === 'description' || name === 'instructions' ? 'md:col-span-2' : ''}`}>
                    {label}
                    <input
                      name={name}
                      value={form[name]}
                      onChange={handleChange}
                      className="mt-1.5 w-full rounded-lg border border-sandal px-3 py-2.5 text-sm"
                    />
                  </label>
                ))}
                <label className="block text-sm font-semibold text-teak">
                  {t('common.category')}
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="mt-1.5 w-full rounded-lg border border-sandal px-3 py-2.5 text-sm"
                  >
                    {sevaCategories.length === 0 && (
                      <option value={form.category}>{form.category}</option>
                    )}
                    {sevaCategories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{localeName(cat, lang)}</option>
                    ))}
                  </select>
                </label>
                {[['amount', t('common.amount')]].map(([name, label]) => (
                  <label key={name} className="block text-sm font-semibold text-teak">
                    {label}
                    <input
                      name={name}
                      type="number"
                      value={form[name]}
                      onChange={handleChange}
                      className="mt-1.5 w-full rounded-lg border border-sandal px-3 py-2.5 text-sm"
                    />
                  </label>
                ))}
                <label className="block text-sm font-semibold text-teak">
                  {t('common.status')}
                  <select
                    name="availabilityStatus"
                    value={form.availabilityStatus}
                    onChange={handleChange}
                    className="mt-1.5 w-full rounded-lg border border-sandal px-3 py-2.5 text-sm"
                  >
                    <option value="active">{t('sevas.active')}</option>
                    <option value="inactive">{t('sevas.inactive')}</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg border border-sandal px-4 py-3 text-sm font-semibold text-ink"
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white">
                  {editingId ? t('sevas.updateSeva') : t('sevas.createSeva')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
