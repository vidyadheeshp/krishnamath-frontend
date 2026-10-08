import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { formatCurrency, formatDate, localeName } from '../utils/format';

const PERIODS = [
  { key: 'daily', labelKey: 'reports.daily' },
  { key: 'weekly', labelKey: 'reports.weekly' },
  { key: 'monthly', labelKey: 'reports.monthly' },
  { key: 'quarterly', labelKey: 'reports.quarterly' },
  { key: 'half-yearly', labelKey: 'reports.halfYearly' },
  { key: 'yearly', labelKey: 'reports.yearly' },
];


function getPeriodRange(period) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  switch (period) {
    case 'daily':
      return { start: new Date(y, m, d), end: new Date(y, m, d + 1) };
    case 'weekly': {
      const day = now.getDay();
      const diffToMon = day === 0 ? -6 : 1 - day;
      const start = new Date(y, m, d + diffToMon);
      return { start, end: new Date(start.getTime() + 7 * 86400000) };
    }
    case 'monthly':
      return { start: new Date(y, m, 1), end: new Date(y, m + 1, 1) };
    case 'quarterly': {
      const q = Math.floor(m / 3);
      return { start: new Date(y, q * 3, 1), end: new Date(y, q * 3 + 3, 1) };
    }
    case 'half-yearly': {
      const half = m < 6 ? 0 : 1;
      return { start: new Date(y, half * 6, 1), end: new Date(y, half * 6 + 6, 1) };
    }
    default: // yearly
      return { start: new Date(y, 0, 1), end: new Date(y + 1, 0, 1) };
  }
}

function inRange(dateStr, start, end) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= start && d < end;
}

function downloadCSV(filename, headers, rows) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.join(','), ...rows.map((r) => r.map(escape).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const PDF_C = {
  dark: [40, 30, 20],
  brown: [91, 55, 35],
  muted: [130, 110, 90],
  sand: [245, 235, 215],
  divider: [220, 200, 170],
  white: [255, 255, 255],
  green: [50, 120, 60],
  red: [180, 50, 50],
};

const PDF_COLS = [
  { header: 'Sl.No', width: 14, align: 'center' },
  { header: 'Receipt', width: 33, align: 'left' },
  { header: 'Devotee', width: 52, align: 'left' },
  { header: 'Seva', width: 52, align: 'left' },
  { header: 'Date', width: 28, align: 'center' },
  { header: 'Amount Collected', width: 35, align: 'right' },
  { header: 'Payment Mode', width: 55, align: 'left' },
];

function downloadPDF({ periodLabel, activePeriod, filteredBookings, totalCollected, totalSpent, netBalance, lang }) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'landscape' });
  const W = doc.internal.pageSize.getWidth();  // 297mm
  const H = doc.internal.pageSize.getHeight(); // 210mm
  const M = 14;
  const CW = W - M * 2;

  const drawPageHeader = () => {
    doc.setFillColor(...PDF_C.brown);
    doc.rect(0, 0, W, 26, 'F');
    doc.setTextColor(...PDF_C.white);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('Sri Krishnamath & Sabhabhavan, Belagavi', W / 2, 11, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(255, 220, 180);
    doc.text(`${periodLabel} Report`, W / 2, 19, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(...PDF_C.muted);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, W - M, 22, { align: 'right' });
  };

  const drawTableHeader = (yPos) => {
    doc.setFillColor(...PDF_C.brown);
    doc.rect(M, yPos, CW, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...PDF_C.white);
    let x = M;
    PDF_COLS.forEach((col) => {
      const tx =
        col.align === 'right' ? x + col.width - 2
        : col.align === 'center' ? x + col.width / 2
        : x + 2;
      doc.text(col.header, tx, yPos + 5.5, { align: col.align });
      x += col.width;
    });
    return yPos + 8;
  };

  drawPageHeader();

  // Stats row
  let y = 32;
  const statW = (CW - 6) / 4;
  const stats = [
    { label: `${periodLabel} Bookings`, value: String(filteredBookings.length) },
    { label: 'Total Collected', value: formatCurrency(totalCollected) },
    { label: 'Total Spent', value: formatCurrency(totalSpent) },
    { label: 'Net Balance', value: formatCurrency(netBalance) },
  ];
  stats.forEach((stat, i) => {
    const sx = M + i * (statW + 2);
    doc.setFillColor(...PDF_C.sand);
    doc.roundedRect(sx, y, statW, 15, 2, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...PDF_C.muted);
    doc.text(stat.label, sx + statW / 2, y + 5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    if (i === 3) {
      doc.setTextColor(...(netBalance >= 0 ? PDF_C.green : PDF_C.red));
    } else {
      doc.setTextColor(...PDF_C.dark);
    }
    doc.text(stat.value, sx + statW / 2, y + 11.5, { align: 'center' });
  });

  y += 20;
  const ROW_H = 6.5;
  y = drawTableHeader(y);

  filteredBookings.forEach((b, i) => {
    if (y + ROW_H > H - 12) {
      doc.addPage();
      drawPageHeader();
      y = drawTableHeader(32);
    }
    if (i % 2 === 0) {
      doc.setFillColor(...PDF_C.sand);
      doc.rect(M, y, CW, ROW_H, 'F');
    }
    const cells = [
      { value: String(i + 1), align: 'center' },
      { value: b.receiptNumber ?? '—', align: 'left' },
      { value: b.devotee?.name ?? '—', align: 'left' },
      { value: localeName(b.seva, lang) || '—', align: 'left' },
      { value: formatDate(b.bookingDate), align: 'center' },
      { value: formatCurrency(b.amountCollected ?? 0), align: 'right' },
      { value: b.paymentMode ?? '—', align: 'left' },
    ];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...PDF_C.dark);
    let x = M;
    cells.forEach((cell, ci) => {
      const col = PDF_COLS[ci];
      const tx =
        cell.align === 'right' ? x + col.width - 2
        : cell.align === 'center' ? x + col.width / 2
        : x + 2;
      const text = doc.splitTextToSize(cell.value, col.width - 4)[0] ?? '';
      doc.text(text, tx, y + 4.5, { align: cell.align });
      x += col.width;
    });
    y += ROW_H;
  });

  // Divider after table
  doc.setDrawColor(...PDF_C.divider);
  doc.setLineWidth(0.3);
  doc.line(M, y, M + CW, y);
  y += 3;

  // Summary rows
  if (y + 24 > H - 10) {
    doc.addPage();
    drawPageHeader();
    y = 32;
  }
  const amtRightEdge = M + PDF_COLS.slice(0, 6).reduce((s, c) => s + c.width, 0);
  const amtLeftEdge = amtRightEdge - PDF_COLS[5].width;
  [
    { label: 'Total Collected', value: formatCurrency(totalCollected), color: PDF_C.dark },
    { label: 'Total Spent', value: formatCurrency(totalSpent), color: PDF_C.dark },
    { label: 'Net Balance', value: formatCurrency(netBalance), color: netBalance >= 0 ? PDF_C.green : PDF_C.red },
  ].forEach((row) => {
    doc.setFillColor(...PDF_C.sand);
    doc.rect(M, y, CW, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...PDF_C.muted);
    doc.text(row.label, amtLeftEdge + 2, y + 5);
    doc.setTextColor(...row.color);
    doc.text(row.value, amtRightEdge - 2, y + 5, { align: 'right' });
    y += 7;
  });

  // Footer band
  doc.setFillColor(...PDF_C.sand);
  doc.rect(0, H - 8, W, 8, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...PDF_C.muted);
  doc.text('Sri Krishnamath & Sabhabhavan, Belagavi — Temple Management System', W / 2, H - 3, { align: 'center' });

  doc.save(`krishnamath-${activePeriod}-report.pdf`);
}

export default function ReportsPage() {
  const [reports, setReports] = useState(null);
  const [activePeriod, setActivePeriod] = useState('monthly');
  const { t, i18n: i18nInst } = useTranslation();
  const lang = i18nInst.language;

  useEffect(() => {
    const loadReports = async () => {
      try {
        const response = await api.get('/reports');
        setReports(response.data.data);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load reports');
      }
    };
    loadReports();
  }, []);

  const { start, end } = useMemo(() => getPeriodRange(activePeriod), [activePeriod]);
  const periodLabel = t(PERIODS.find((p) => p.key === activePeriod)?.labelKey ?? 'reports.monthly');

  const filteredBookings = useMemo(
    () =>
      (reports?.bookings || []).filter(
        (b) => b.status !== 'cancelled' && inRange(b.bookingDate, start, end),
      ),
    [reports, start, end],
  );

  const filteredExpenditures = useMemo(
    () => (reports?.expenditures || []).filter((e) => inRange(e.expenseDate, start, end)),
    [reports, start, end],
  );

  const totalCollected = useMemo(
    () => filteredBookings.reduce((sum, b) => sum + (b.amountCollected || 0), 0),
    [filteredBookings],
  );

  const totalSpent = useMemo(
    () => filteredExpenditures.reduce((sum, e) => sum + (e.expenseAmount || 0), 0),
    [filteredExpenditures],
  );

  const netBalance = totalCollected - totalSpent;

  const periodPaymentModes = useMemo(() => {
    const map = {};
    filteredBookings.forEach((b) => {
      const key = b.paymentMode ?? 'Unknown';
      if (!map[key]) map[key] = { paymentMode: key, amount: 0 };
      map[key].amount += b.amountCollected || 0;
    });
    return Object.values(map).sort((a, b) => a.amount - b.amount);
  }, [filteredBookings]);

  const periodSevaRevenue = useMemo(() => {
    const map = {};
    filteredBookings.forEach((b) => {
      const key = b.seva?.id ?? b.seva?.name ?? 'Unknown';
      const displayName = localeName(b.seva, lang) || 'Unknown';
      if (!map[key]) map[key] = { sevaName: displayName, revenue: 0 };
      else map[key].sevaName = displayName;
      map[key].revenue += b.amountCollected || 0;
    });
    return Object.values(map).sort((a, b) => a.revenue - b.revenue);
  }, [filteredBookings, lang]);

  const tableRows = useMemo(
    () =>
      filteredBookings.map((b) => ({
        ...b,
        devoteeName: b.devotee?.name ?? '—',
        sevaName: localeName(b.seva, lang) || '—',
        _search: b.devotee?.mobileNumber,
      })),
    [filteredBookings, lang],
  );

  const bookingColumns = useMemo(
    () => [
      { key: 'slNo', header: t('common.slNo') },
      { key: 'receiptNumber', header: t('bookings.receipt') },
      { key: 'devoteeName', header: t('bookings.devotee') },
      { key: 'sevaName', header: t('reports.sevaName') },
      { key: 'bookingDate', header: t('common.date'), render: (v) => formatDate(v) },
      { key: 'amountCollected', header: t('reports.amountCollected'), render: (v) => formatCurrency(v) },
      { key: 'paymentMode', header: t('common.paymentMode') },
    ],
    [t],
  );

  const paymentColumns = useMemo(
    () => [
      { key: 'paymentMode', header: t('common.paymentMode') },
      { key: 'amount', header: t('reports.amountCollected'), render: (v) => formatCurrency(v) },
    ],
    [t],
  );

  const sevaColumns = useMemo(
    () => [
      { key: 'slNo', header: t('common.slNo') },
      { key: 'sevaName', header: t('reports.sevaName') },
      { key: 'revenue', header: t('reports.revenue'), render: (v) => formatCurrency(v) },
    ],
    [t],
  );

  const auditColumns = useMemo(
    () => [
      { key: 'action', header: t('reports.action') },
      { key: 'entity', header: t('reports.entity') },
      { key: 'actor', header: t('reports.actor') },
      { key: 'createdAt', header: t('reports.timestamp') },
    ],
    [t],
  );

  const handleChangePeriod = (key) => {
    setActivePeriod(key);
  };

  const handleDownloadPDF = () => {
    downloadPDF({ periodLabel, activePeriod, filteredBookings, totalCollected, totalSpent, netBalance, lang });
  };

  const handleDownload = () => {
    const headers = ['Sl.No', 'Receipt No', 'Devotee', 'Seva', 'Booking Date', 'Amount Collected', 'Payment Mode'];
    const rows = filteredBookings.map((b, i) => [
      i + 1,
      b.receiptNumber ?? '',
      b.devotee?.name ?? '',
      localeName(b.seva, lang) || '',
      b.bookingDate ?? '',
      b.amountCollected ?? 0,
      b.paymentMode ?? '',
    ]);
    rows.push([]);
    rows.push(['', '', '', '', 'Total Collected', totalCollected, '']);
    rows.push(['', '', '', '', 'Total Spent', totalSpent, '']);
    rows.push(['', '', '', '', 'Net Balance', netBalance, '']);
    downloadCSV(`krishnamath-${activePeriod}-report.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('reports.title')}
        description={t('reports.description')}
      />

      {/* Period selector */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <p className="mb-3 text-sm font-semibold text-teak">{t('reports.selectPeriod')}</p>
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => handleChangePeriod(p.key)}
              className={`rounded-lg border px-5 py-2 text-sm font-semibold transition-colors ${
                activePeriod === p.key
                  ? 'border-ink bg-ink text-white'
                  : 'border-sandal bg-white text-ink hover:bg-sandal/40'
              }`}
            >
              {t(p.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Period statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={`${periodLabel} ${t('reports.bookings')}`} value={filteredBookings.length} tone="plain" />
        <StatCard label={`${periodLabel} ${t('reports.collected')}`} value={totalCollected} currency tone="warm" />
        <StatCard label={`${periodLabel} ${t('reports.spent')}`} value={totalSpent} currency tone="earthy" />
        <StatCard
          label={t('reports.netBalance')}
          value={netBalance}
          currency
          tone={netBalance >= 0 ? 'warm' : 'earthy'}
        />
      </div>

      {/* Bookings list for period */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">{periodLabel} {t('reports.bookings')}</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={filteredBookings.length === 0}
              className="rounded-lg border border-sandal bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:bg-sandal/40 disabled:opacity-40"
            >
              {t('common.downloadCSV')}
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={filteredBookings.length === 0}
              className="rounded-lg border border-terracotta/40 bg-white px-5 py-2.5 text-sm font-semibold text-terracotta hover:bg-terracotta/10 disabled:opacity-40"
            >
              {t('common.downloadPDF')}
            </button>
          </div>
        </div>

        <DataTable
          columns={bookingColumns}
          rows={tableRows}
          emptyText={t('reports.noBookings')}
        />

      </div>

      {/* Period payment mode & seva revenue breakdown */}
      <div className="grid gap-6 xl:grid-cols-2">
        {/* Payment mode breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="mb-4 text-base font-semibold text-ink">{periodLabel} — {t('reports.byPaymentMode')}</h2>
          <DataTable
            columns={paymentColumns}
            rows={periodPaymentModes}
            emptyText={t('reports.noCollections')}
          />
        </div>

        {/* Seva revenue breakdown */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
          <h2 className="mb-4 text-base font-semibold text-ink">{periodLabel} — {t('reports.bySeva')}</h2>
          <DataTable
            columns={sevaColumns}
            rows={periodSevaRevenue}
            emptyText={t('reports.noSevaRevenue')}
            defaultSort={{ key: 'revenue', direction: 'desc' }}
          />
        </div>
      </div>

      {/* Audit log */}
      <DataTable
        columns={auditColumns}
        rows={reports?.auditLogs || []}
        emptyText={t('reports.noAudit')}
      />
    </div>
  );
}
