import jsPDF from 'jspdf';

import { formatCurrency, formatDate } from './format';

// Colour palette
const C = {
  dark: [40, 30, 20],
  brown: [91, 55, 35],
  accent: [150, 88, 50],
  muted: [130, 110, 90],
  sand: [245, 235, 215],
  divider: [220, 200, 170],
  white: [255, 255, 255],
};

export function generateReceipt(booking) {
  const doc = new jsPDF({ format: 'a5', unit: 'mm', orientation: 'portrait' });
  const W = doc.internal.pageSize.getWidth();   // 148mm
  const H = doc.internal.pageSize.getHeight();  // 210mm
  const M = 14;                                 // margin
  const CW = W - M * 2;                         // content width

  // ── Header band ──────────────────────────────────────────────────────────
  doc.setFillColor(...C.brown);
  doc.rect(0, 0, W, 38, 'F');

  doc.setTextColor(...C.white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Krishnamath', W / 2, 16, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 220, 180);
  doc.text('Temple Seva Receipt', W / 2, 24, { align: 'center' });

  // ── Receipt number + date row ─────────────────────────────────────────────
  let y = 46;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...C.dark);
  doc.text(booking.receiptNumber ?? '—', M, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...C.muted);
  doc.text(formatDate(booking.bookingDate), W - M, y, { align: 'right' });

  y += 5;
  doc.setDrawColor(...C.divider);
  doc.setLineWidth(0.4);
  doc.line(M, y, W - M, y);
  y += 7;

  // ── Helper: draw a 2-column field pair ────────────────────────────────────
  const field = (label, value, x) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...C.muted);
    doc.text(label.toUpperCase(), x, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...C.dark);
    const text = String(value ?? '—');
    // Truncate long text to fit column
    const maxW = CW / 2 - 4;
    const safe = doc.getTextWidth(text) > maxW ? doc.splitTextToSize(text, maxW)[0] + '…' : text;
    doc.text(safe, x, y + 5);
  };

  const sectionTitle = (title) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...C.accent);
    doc.text(title, M, y);
    y += 6;
  };

  const divider = () => {
    doc.setDrawColor(...C.divider);
    doc.setLineWidth(0.3);
    doc.line(M, y, W - M, y);
    y += 6;
  };

  const rowPair = (l1, v1, l2, v2) => {
    field(l1, v1, M);
    if (l2) field(l2, v2, W / 2 + 2);
    y += 13;
  };

  // ── Devotee section ───────────────────────────────────────────────────────
  sectionTitle('DEVOTEE DETAILS');
  rowPair('Name', booking.devotee?.name, 'Mobile', booking.devotee?.mobileNumber);
  rowPair('Address', booking.devotee?.address);
  rowPair('Gotra', booking.devotee?.gotra, 'Nakshatra', booking.devotee?.nakshatra);
  rowPair('Raashi', booking.devotee?.raashi);

  divider();

  // ── Seva section ──────────────────────────────────────────────────────────
  sectionTitle('SEVA DETAILS');
  const bookingSevas = Array.isArray(booking.sevas) && booking.sevas.length > 0 ? booking.sevas : booking.seva ? [booking.seva] : [];
  const sevaNames = bookingSevas.map((seva) => seva?.name).filter(Boolean);

  rowPair('Sevas', sevaNames.length > 0 ? sevaNames.join(', ') : '—', 'Count', sevaNames.length || 1);
  rowPair('Time', booking.bookingTime);

  divider();

  // ── Payment section ───────────────────────────────────────────────────────
  sectionTitle('PAYMENT DETAILS');
  rowPair('Payment mode', booking.paymentMode, 'Reference', booking.paymentReferenceNumber || '—');
  rowPair('Amount payable', formatCurrency(booking.amountPayable), 'Discount', formatCurrency(booking.discount));

  // Amount collected highlight box
  doc.setFillColor(...C.sand);
  doc.roundedRect(M, y, CW, 13, 2.5, 2.5, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...C.muted);
  doc.text('AMOUNT COLLECTED', M + 4, y + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...C.dark);
  doc.text(formatCurrency(booking.amountCollected), W - M - 4, y + 8.5, { align: 'right' });
  y += 18;

  // ── Notes ─────────────────────────────────────────────────────────────────
  if (booking.notes) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(...C.muted);
    const lines = doc.splitTextToSize(`Notes: ${booking.notes}`, CW);
    doc.text(lines, M, y);
    y += lines.length * 4.5 + 4;
  }

  // ── Footer band ───────────────────────────────────────────────────────────
  doc.setFillColor(...C.sand);
  doc.rect(0, H - 14, W, 14, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...C.muted);
  doc.text('Thank you for your seva. May Sri Krishna bless you.', W / 2, H - 6, { align: 'center' });

  doc.save(`receipt-${booking.receiptNumber}.pdf`);
}
