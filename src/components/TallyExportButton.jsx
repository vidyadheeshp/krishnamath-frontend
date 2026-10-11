import { FileJson, FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import api from '../api/client';

const BUTTON_CLASS =
  'inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60';

const CSV_COLUMNS = ['date', 'particulars', 'modeOfPayment', 'amount'];

// One CSV cell: quoted when needed, and text that a spreadsheet could read as a formula is defused.
const csvCell = (value) => {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text) && Number.isNaN(Number(text))) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// A leading byte-order mark lets Excel open the file as UTF-8.
const toCsv = (entries) => `\uFEFF${[CSV_COLUMNS.join(','), ...entries.map((entry) => CSV_COLUMNS.map((column) => csvCell(entry[column])).join(','))].join('\r\n')}\r\n`;

const download = (content, type, filename) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

// Downloads the receipts (or expenditure) of the selected period as a JSON or CSV file for Tally / audit records.
export default function TallyExportButton({ year, month, category, kind = 'receipts' }) {
  const { t } = useTranslation();
  const [busyFormat, setBusyFormat] = useState(null);
  const isExpenditure = kind === 'expenditure';

  const handleExport = async (format) => {
    setBusyFormat(format);

    try {
      const response = await api.get(isExpenditure ? '/finance/export-expenditures' : '/finance/export', {
        params: { year, month: month || undefined, category: category || undefined, format },
      });
      const entries = response.data.data;

      if (entries.length === 0) {
        toast.info(t('finance.exportEmpty'));
        return;
      }

      const name = `krishnamath-${isExpenditure ? 'expenditure' : 'receipts'}-${year}${month ? `-${String(month).padStart(2, '0')}` : ''}${category ? `-${category}` : ''}`;

      if (format === 'csv') {
        download(toCsv(entries), 'text/csv;charset=utf-8', `${name}.csv`);
      } else {
        download(JSON.stringify(entries, null, 2), 'application/json', `${name}.json`);
      }

      toast.success(t('finance.exportDone', { count: entries.length }));
    } catch (error) {
      toast.error(error.response?.data?.message || t('finance.exportFailed'));
    } finally {
      setBusyFormat(null);
    }
  };

  return (
    <>
      <button type="button" onClick={() => handleExport('json')} disabled={busyFormat !== null} className={BUTTON_CLASS}>
        <FileJson className="h-4 w-4" aria-hidden="true" />
        {isExpenditure ? t('finance.exportExpenditureJson') : t('finance.exportJson')}
      </button>
      <button type="button" onClick={() => handleExport('csv')} disabled={busyFormat !== null} className={BUTTON_CLASS}>
        <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
        {isExpenditure ? t('finance.exportExpenditureCsv') : t('finance.exportCsv')}
      </button>
    </>
  );
}
