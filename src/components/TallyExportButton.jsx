import { FileJson } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import api from '../api/client';

// Downloads the receipts of the selected period as a JSON file for import into Tally / audit records.
export default function TallyExportButton({ year, month, category, kind = 'receipts' }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);

    try {
      const response = await api.get(kind === 'expenditure' ? '/finance/export-expenditures' : '/finance/export', { params: { year, month: month || undefined, category: category || undefined } });
      const entries = response.data.data;

      if (entries.length === 0) {
        toast.info(t('finance.exportEmpty'));
        return;
      }

      const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `krishnamath-${kind === 'expenditure' ? 'expenditure' : 'receipts'}-${year}${month ? `-${String(month).padStart(2, '0')}` : ''}${category ? `-${category}` : ''}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success(t('finance.exportDone', { count: entries.length }));
    } catch (error) {
      toast.error(error.response?.data?.message || t('finance.exportFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
    >
      <FileJson className="h-4 w-4" aria-hidden="true" />
      {kind === 'expenditure' ? t('finance.exportExpenditureJson') : t('finance.exportJson')}
    </button>
  );
}
