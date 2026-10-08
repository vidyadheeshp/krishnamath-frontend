import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { localeName } from '../utils/format';

const metadataTypes = [
  { value: 'gotras', labelKey: 'metadata.gotras' },
  { value: 'nakshatras', labelKey: 'metadata.nakshatras' },
  { value: 'raashis', labelKey: 'metadata.raashis' },
  { value: 'paymentModes', labelKey: 'metadata.paymentModes' },
  { value: 'eventTypes', labelKey: 'metadata.eventTypes' },
  { value: 'sevaCategories', labelKey: 'metadata.sevaCategories' },
];

export default function MetadataPage() {
  const [selectedType, setSelectedType] = useState(metadataTypes[0].value);
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [nameKn, setNameKn] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingNameKn, setEditingNameKn] = useState('');
  const { t, i18n: i18nInst } = useTranslation();
  const lang = i18nInst.language;

  const selectedLabelKey = metadataTypes.find((m) => m.value === selectedType)?.labelKey ?? '';
  const selectedLabel = selectedLabelKey ? t(selectedLabelKey) : '';

  const loadItems = async (type) => {
    try {
      const response = await api.get(`/metadata/${type}`);
      setItems(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load metadata');
    }
  };

  useEffect(() => {
    loadItems(selectedType);
    setEditingId(null);
  }, [selectedType]);

  const handleStartEdit = (row) => {
    setEditingId(row.id);
    setEditingName(row.name);
    setEditingNameKn(row.nameKn || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingNameKn('');
  };

  const handleSaveEdit = async (row) => {
    if (!editingName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    try {
      await api.put(`/metadata/${selectedType}/${row.id}`, { name: editingName.trim(), nameKn: editingNameKn.trim(), enabled: row.enabled });
      toast.success('Metadata updated');
      setEditingId(null);
      setEditingName('');
      setEditingNameKn('');
      loadItems(selectedType);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update metadata');
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete "${row.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/metadata/${selectedType}/${row.id}`);
      toast.success('Metadata deleted');
      loadItems(selectedType);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete metadata');
    }
  };

  const columns = useMemo(
    () => [
      { key: 'slNo', header: t('common.slNo') },
      {
        key: 'name',
        header: t('metadata.name'),
        render: (value, row) =>
          editingId === row.id ? (
            <div className="flex flex-col gap-1.5">
              <input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(row); if (e.key === 'Escape') handleCancelEdit(); }}
                className="w-full rounded-xl border border-sandal px-3 py-1.5 text-sm"
                placeholder={t('metadata.name')}
                autoFocus
              />
              <input
                value={editingNameKn}
                onChange={(e) => setEditingNameKn(e.target.value)}
                className="w-full rounded-xl border border-sandal px-3 py-1.5 text-sm"
                placeholder={t('common.nameKn')}
              />
            </div>
          ) : localeName(row, lang),
      },
      {
        key: 'enabled',
        header: t('metadata.status'),
        render: (value) => (value ? t('metadata.enabled') : t('metadata.disabled')),
        searchValue: (row) => (row.enabled ? t('metadata.enabled') : t('metadata.disabled')),
        sortValue: (row) => (row.enabled ? 0 : 1),
      },
      {
        key: 'id',
        header: 'Actions',
        render: (_value, row) =>
          editingId === row.id ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSaveEdit(row)}
                className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-lg border border-sandal px-3 py-1.5 text-xs font-semibold text-ink"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleStartEdit(row)}
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
    [editingId, editingName, editingNameKn, lang, t],
  );

  // Search, sort and paging are handled by the table; the Kannada name is searchable too.
  const tableRows = useMemo(() => items.map((item) => ({ ...item, _search: item.nameKn })), [items]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      toast.error('Enter a metadata name');
      return;
    }

    try {
      await api.post(`/metadata/${selectedType}`, { name, nameKn: nameKn.trim(), enabled: true });
      setName('');
      setNameKn('');
      toast.success('Metadata created');
      loadItems(selectedType);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create metadata');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('metadata.title')}
        description={t('metadata.description')}
      />
      <section className="grid gap-6 xl:grid-cols-[280px_1fr]">
        {/* Left: type selector buttons + add form */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-card">
            <p className="px-2 pb-3 text-xs font-semibold uppercase tracking-wide text-teak/60">Categories</p>
            <div className="flex flex-col gap-1">
              {metadataTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSelectedType(type.value)}
                  className={`rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition ${
                    selectedType === type.value
                      ? 'bg-brand text-white'
                      : 'text-teak hover:bg-sandal/40'
                  }`}
                >
                  {t(type.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <form className="rounded-xl border border-slate-200 bg-white p-5 shadow-card" onSubmit={handleSubmit}>
            <h2 className="text-base font-semibold text-ink">{t('common.add')} {selectedLabel}</h2>
            <label className="mt-4 block text-sm font-semibold text-teak">
              {t('metadata.name')}
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-lg border border-sandal px-4 py-3"
                placeholder={t('metadata.enterName')}
              />
            </label>
            <label className="mt-3 block text-sm font-semibold text-teak">
              {t('common.nameKn')}
              <input
                value={nameKn}
                onChange={(event) => setNameKn(event.target.value)}
                className="mt-2 w-full rounded-lg border border-sandal px-4 py-3"
                placeholder="ಕನ್ನಡ ಹೆಸರು"
              />
            </label>
            <button type="submit" className="mt-4 w-full rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white">
              {t('common.save')}
            </button>
          </form>
        </div>

        {/* Right: table + pagination */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-ink">{selectedLabel}</h2>
            <p className="mt-1 text-sm text-slate-500">{items.length} {t('receipts.entries')}</p>
          </div>

          <DataTable key={selectedType} columns={columns} rows={tableRows} emptyText={t('metadata.noItems')} />
        </div>
      </section>
    </div>
  );
}

