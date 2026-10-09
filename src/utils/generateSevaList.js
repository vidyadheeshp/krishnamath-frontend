import jsPDF from 'jspdf';

import { masaName, panchangLimbs } from '../constants/panchang';
import { openPdfWindow } from './pdfWindow';

// The standard PDF fonts cannot draw Kannada, so the priest's sheet is printed in English.
const INK = [20, 20, 20];
const GREY = [110, 110, 110];
const LIGHT = [225, 228, 233];

const MARGIN = 12;
const LINE = 4.4;
const COLUMNS = [
  { key: 'sl', title: 'Sl.', width: 10 },
  { key: 'name', title: 'Name', width: 46 },
  { key: 'gotra', title: 'Gotra', width: 26 },
  { key: 'nakshatra', title: 'Nakshatra', width: 28 },
  { key: 'raashi', title: 'Raashi', width: 24 },
  { key: 'sevas', title: 'Sevas booked', width: 52 },
];

const LIMB_LABELS = { tithi: 'TITHI', vara: 'VARA', nakshatra: 'NAKSHATRA', yoga: 'YOGA', karana: 'KARANA' };

const longDate = (isoDate) =>
  new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${isoDate}T12:00:00`));

export function buildSevaListPdf(list) {
  const doc = new jsPDF({ format: 'a4', unit: 'mm', orientation: 'portrait' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const tableWidth = W - MARGIN * 2;
  const dateText = longDate(list.date);
  const dayLabel = list.day === 'tomorrow' ? 'Tomorrow' : 'Today';

  const text = (value, x, y, { size = 10, style = 'normal', align = 'left', color = INK } = {}) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.text(String(value), x, y, { align });
  };

  // ── First-page heading: the date goes on top ──────────────────────────────
  text('Sri Krishnamath & Sabhabhavan, Belagavi', W / 2, 15, { size: 13, style: 'bold', align: 'center' });
  text('SEVA LIST FOR THE PRIEST', W / 2, 21, { size: 9, style: 'bold', color: GREY, align: 'center' });
  text(dateText, W / 2, 34, { size: 21, style: 'bold', align: 'center' });
  text(dayLabel, W / 2, 40, { size: 10, color: GREY, align: 'center' });

  let y = 47;

  // The day's panchanga: tithi, vara, nakshatra, yoga and karana (as at sunrise, with the time each ends).
  if (list.panchang) {
    const day = list.panchang;
    text(`${masaName(day.masa, day.adhika, 'en')} Masa`, W / 2, y, { size: 9, style: 'bold', align: 'center' });
    y += 3;
    const cellWidth = tableWidth / 5;
    doc.setDrawColor(...LIGHT);
    doc.setLineWidth(0.3);
    doc.rect(MARGIN, y, tableWidth, 15);
    panchangLimbs(day, 'en').forEach((limb, index) => {
      const x = MARGIN + index * cellWidth;
      if (index > 0) doc.line(x, y, x, y + 15);
      const centre = x + cellWidth / 2;
      text(LIMB_LABELS[limb.key], centre, y + 4, { size: 7, style: 'bold', color: GREY, align: 'center' });

      let size = 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(size);
      while (size > 7 && doc.getTextWidth(limb.value) > cellWidth - 3) {
        size -= 0.5;
        doc.setFontSize(size);
      }
      text(limb.value, centre, y + 9, { size, style: 'bold', align: 'center' });
      if (limb.until) text(`till ${limb.until}`, centre, y + 12.8, { size: 7.5, color: GREY, align: 'center' });
    });
    y += 19;
  }

  if (list.blockedReason) {
    text(`${list.blockedReason} - bookings are closed for this day`, W / 2, y, { size: 9, color: GREY, align: 'center' });
    y += 5;
  }
  text(`Bookings: ${list.totals.bookings}      Sevas to be performed: ${list.totals.sevas}`, W / 2, y, { size: 10, style: 'bold', align: 'center' });
  y += 4;
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, W - MARGIN, y);
  y += 4;

  const drawTableHeader = () => {
    doc.setFillColor(...LIGHT);
    doc.rect(MARGIN, y, tableWidth, 7, 'F');
    let x = MARGIN;
    COLUMNS.forEach((column) => {
      text(column.title.toUpperCase(), x + 2, y + 4.8, { size: 8, style: 'bold' });
      x += column.width;
    });
    y += 7;
  };

  // Continuation pages repeat the date at the top.
  const startContinuationPage = () => {
    doc.addPage();
    text(`Seva list - ${dateText} (continued)`, MARGIN, 14, { size: 11, style: 'bold' });
    doc.setDrawColor(...INK);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, 17, W - MARGIN, 17);
    y = 21;
  };

  const bottomLimit = H - 16;

  if (list.entries.length === 0) {
    text('No sevas are booked for this day.', W / 2, y + 22, { size: 12, color: GREY, align: 'center' });
  } else {
    drawTableHeader();

    list.entries.forEach((entry, index) => {
      const cells = {
        sl: String(index + 1),
        name: entry.name || '-',
        gotra: entry.gotra || '-',
        nakshatra: entry.nakshatra || '-',
        raashi: entry.raashi || '-',
        sevas: entry.sevas.map((seva) => seva.name).join(', ') || '-',
      };

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      const wrapped = COLUMNS.map((column) => doc.splitTextToSize(cells[column.key], column.width - 4));
      const rowHeight = Math.max(...wrapped.map((lines) => lines.length)) * LINE + 3.6;

      if (y + rowHeight > bottomLimit) {
        startContinuationPage();
        drawTableHeader();
      }

      let x = MARGIN;
      COLUMNS.forEach((column, columnIndex) => {
        wrapped[columnIndex].forEach((line, lineIndex) => {
          text(line, x + 2, y + 5 + lineIndex * LINE, { size: 9.5, style: column.key === 'name' ? 'bold' : 'normal' });
        });
        x += column.width;
      });

      y += rowHeight;
      doc.setDrawColor(...LIGHT);
      doc.setLineWidth(0.25);
      doc.line(MARGIN, y, W - MARGIN, y);
    });

    // ── Seva-wise count, so the priest can prepare ──────────────────────────
    if (list.sevaCounts.length > 0) {
      const needed = 12 + Math.ceil(list.sevaCounts.length / 2) * 5.5;
      if (y + needed > bottomLimit) startContinuationPage();
      else y += 8;

      text('Seva-wise count', MARGIN, y, { size: 10.5, style: 'bold' });
      y += 5.5;
      const half = tableWidth / 2;
      list.sevaCounts.forEach((item, index) => {
        const column = index % 2;
        const rowY = y + Math.floor(index / 2) * 5.5;
        const name = doc.splitTextToSize(item.name, half - 22)[0];
        text(name, MARGIN + column * half, rowY, { size: 9.5 });
        text(String(item.count), MARGIN + column * half + half - 12, rowY, { size: 9.5, style: 'bold', align: 'right' });
      });
    }
  }

  // ── Footer on every page ───────────────────────────────────────────────────
  const pages = doc.getNumberOfPages();
  const stamp = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date());
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...LIGHT);
    doc.setLineWidth(0.25);
    doc.line(MARGIN, H - 12, W - MARGIN, H - 12);
    text(`Prepared ${stamp}`, MARGIN, H - 7.5, { size: 8, color: GREY });
    text(`Page ${page} of ${pages}`, W - MARGIN, H - 7.5, { size: 8, color: GREY, align: 'right' });
  }

  return doc;
}

// Opens the priest's sheet in a new window (print / save from there). Call from a click handler.
export const openSevaListPdf = (list, options = {}) => openPdfWindow(() => buildSevaListPdf(list), `Seva list ${list.date}`, options);
