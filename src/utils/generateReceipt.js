import jsPDF from 'jspdf';
import { toast } from 'sonner';

import { CATEGORY_NAMES } from '../constants/paymentCategories';
import { formatDate } from './format';

// Half of an A4 sheet (A4 landscape cut across the middle): 210 x 148.5 mm.
const PAGE = [210, 148.5];
const BLACK = [20, 20, 20];
const GREY = [110, 110, 110];

// The built-in PDF fonts have no rupee glyph, so amounts are written as "Rs. 1,234".
const formatRs = (value) =>
  `Rs. ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: Number(value) % 1 ? 2 : 0 }).format(Number(value || 0))}`;

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve',
  'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const belowThousand = (n) => {
  const parts = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)]);
    n %= 10;
  }
  if (n > 0) parts.push(ONES[n]);
  return parts.join(' ');
};

// Indian numbering: crore, lakh, thousand.
const amountInWords = (value) => {
  const total = Math.round(Number(value || 0) * 100);
  let rupees = Math.floor(total / 100);
  const paise = total % 100;

  if (rupees === 0 && paise === 0) return 'Zero Rupees Only';

  const parts = [];
  [[10000000, 'Crore'], [100000, 'Lakh'], [1000, 'Thousand']].forEach(([size, name]) => {
    if (rupees >= size) {
      parts.push(`${belowThousand(Math.floor(rupees / size))} ${name}`);
      rupees %= size;
    }
  });
  if (rupees > 0) parts.push(belowThousand(rupees));

  const rupeeText = parts.length > 0 ? `${parts.join(' ')} Rupees` : '';
  const paiseText = paise > 0 ? `${rupeeText ? ' and ' : ''}${belowThousand(paise)} Paise` : '';
  return `${rupeeText}${paiseText} Only`;
};

function buildReceipt(booking) {
  const doc = new jsPDF({ format: PAGE, unit: 'mm', orientation: 'landscape' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 14; // inner margin
  const R = W - M;

  const text = (value, x, y, { size = 10, style = 'normal', align = 'left', color = BLACK } = {}) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.text(String(value), x, y, { align });
  };

  // Plain "Label ........ value ........" line: dotted rule under the (bold) value, like a handwritten receipt.
  const fillLine = (label, value, x, y, width) => {
    text(label, x, y, { size: 10 });
    doc.setFontSize(10);
    const labelWidth = doc.getTextWidth(label) + 2.5;
    const start = x + labelWidth;
    // Measure in the weight and size the value is drawn in, otherwise long values overrun the frame.
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    const lines = doc.splitTextToSize(String(value || '-'), x + width - start);

    doc.setLineWidth(0.2);
    doc.setDrawColor(...GREY);
    doc.setLineDashPattern([0.5, 0.9], 0);
    lines.forEach((line, index) => {
      const lineY = y + index * 6;
      text(line, start, lineY, { size: 10.5, style: 'bold' });
      doc.line(start, lineY + 1.4, x + width, lineY + 1.4);
    });
    doc.setLineDashPattern([], 0);

    return y + lines.length * 6 + 1.5;
  };

  // ── Frame ────────────────────────────────────────────────────────────────
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.4);
  doc.rect(7, 7, W - 14, H - 14);

  // ── Heading ──────────────────────────────────────────────────────────────
  text('Sri Krishnamath & Sabhabhavan, Belagavi', W / 2, 20, { size: 17, style: 'bold', align: 'center' });
  text(booking.receiptTitle || 'SEVA RECEIPT', W / 2, 34, { size: 11, style: 'bold', align: 'center' });
  doc.setLineWidth(0.3);
  doc.setDrawColor(...BLACK);
  doc.line(W / 2 - 22, 35.6, W / 2 + 22, 35.6);

  // ── Receipt number / date ────────────────────────────────────────────────
  const issuedOn = booking.createdAt ? formatDate(booking.createdAt) : formatDate(booking.bookingDate);
  text('Receipt No.:', M, 46, { size: 10 });
  text(booking.receiptNumber ?? '-', M + 23, 46, { size: 10.5, style: 'bold' });
  text(issuedOn, R, 46, { size: 10.5, style: 'bold', align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  text('Date:', R - doc.getTextWidth(issuedOn) - 3, 46, { size: 10, align: 'right' });

  // ── Body ─────────────────────────────────────────────────────────────────
  const devotee = booking.devotee || {};
  const sevas = Array.isArray(booking.sevas) && booking.sevas.length > 0 ? booking.sevas : booking.seva ? [booking.seva] : [];
  const sevaNames = sevas.map((seva) => seva?.name).filter(Boolean).join(', ');
  const contentWidth = R - M;
  const third = contentWidth / 3;
  let y = 58;

  y = fillLine('Received with thanks from', devotee.name, M, y, contentWidth);

  if (booking.hideStars) {
    y += 1.5;
  } else {
    fillLine('Gotra', devotee.gotra, M, y, third - 4);
    fillLine('Nakshatra', devotee.nakshatra, M + third, y, third - 4);
    y = fillLine('Raashi', devotee.raashi, M + third * 2, y, third) + 1.5;
  }

  y = fillLine(booking.towardsLabel || 'Towards seva', sevaNames, M, y, contentWidth) + 1.5;

  const half = contentWidth / 2;
  const modeText = booking.paymentReferenceNumber ? `${booking.paymentMode} (${booking.paymentReferenceNumber})` : booking.paymentMode;
  if (booking.hideDateRow) {
    // Receipts that are not for a dated seva already show their date in the heading.
    y = fillLine('Paid by', modeText, M, y, contentWidth) + 1.5;
  } else {
    fillLine('Seva date', formatDate(booking.bookingDate), M, y, half - 6);
    y = fillLine('Paid by', modeText, M + half, y, half) + 1.5;
  }

  y = fillLine('Sum of rupees', amountInWords(booking.amountCollected), M, y, contentWidth);

  // ── Amount box + signature ───────────────────────────────────────────────
  const boxY = Math.max(y + 5, 106);
  doc.setLineWidth(0.5);
  doc.setDrawColor(...BLACK);
  doc.rect(M, boxY, 62, 13);
  text('Rs.', M + 3, boxY + 8.5, { size: 11 });
  text(
    new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: Number(booking.amountCollected) % 1 ? 2 : 0 }).format(
      Number(booking.amountCollected || 0),
    ),
    M + 59,
    boxY + 9,
    { size: 15, style: 'bold', align: 'right' },
  );

  if (Number(booking.donation) > 0) {
    text(`(Seva ${formatRs(booking.amountPayable)} + Donation ${formatRs(booking.donation)})`, M, boxY + 18.5, { size: 8, color: GREY });
  }

  doc.setLineWidth(0.3);
  doc.line(R - 52, boxY + 11, R, boxY + 11);
  text('Authorised Signatory', R - 26, boxY + 16, { size: 9, align: 'center' });

  text('Thank you for your seva. May Sri Krishna bless you.', W / 2, H - 10.5, { size: 8.5, color: GREY, align: 'center' });

  if (booking.status === 'cancelled') {
    // A cancelled booking can still be reprinted, but it is clearly marked as void.
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(58);
    doc.setTextColor(200, 40, 40);
    doc.setGState(new doc.GState({ opacity: 0.2 })); // translucent, so the receipt stays readable underneath
    doc.text('CANCELLED', W / 2, H / 2 + 14, { align: 'center', angle: 18 });
    doc.setGState(new doc.GState({ opacity: 1 }));
  }

  return doc;
}

// Annadana Seva / Donation receipts (records from the receipts table) use the same sheet as a seva
// booking, minus the gotra line, with the category as the purpose of the payment.
export const receiptToDocument = (receipt) => {
  const label = CATEGORY_NAMES[receipt.category] || 'Receipt';

  return {
    receiptNumber: receipt.receiptNumber,
    bookingDate: receipt.receiptDate,
    createdAt: receipt.createdAt,
    devotee: { name: receipt.devoteeName, mobileNumber: receipt.mobileNumber },
    sevas: [{ name: receipt.notes ? `${label} - ${receipt.notes}` : label }],
    paymentMode: receipt.paymentMode,
    paymentReferenceNumber: receipt.paymentReferenceNumber,
    amountPayable: receipt.amount,
    donation: 0,
    amountCollected: receipt.amount,
    receiptTitle: `${label.toUpperCase()} RECEIPT`,
    hideStars: true,
    towardsLabel: 'Towards',
    hideDateRow: true,
  };
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);

// Opens the receipt as a PDF in a new browser window (nothing is downloaded). The viewer there offers
// print and save if the user wants them. With `print: true` the print dialog is raised automatically.
// Must be called straight from a click handler so the browser does not treat the window as a popup.
export function openReceipt(booking, { print = false } = {}) {
  const receiptWindow = window.open('', '_blank');

  if (!receiptWindow) {
    toast.error('Your browser blocked the receipt window. Allow pop-ups for this site and try again.');
    return false;
  }

  try {
    const url = URL.createObjectURL(buildReceipt(booking).output('blob'));
    const title = escapeHtml(`Receipt ${booking.receiptNumber}`);

    receiptWindow.document.open();
    receiptWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>html,body{margin:0;height:100%;background:#475569}iframe{border:0;width:100%;height:100%}</style></head>
<body><iframe id="receipt" src="${url}" title="${title}"></iframe>
<script>${
      print
        ? "document.getElementById('receipt').addEventListener('load',function(){setTimeout(function(){try{this.contentWindow.focus();this.contentWindow.print();}catch(e){window.print();}}.bind(this),400);});"
        : ''
    }</script></body></html>`);
    receiptWindow.document.close();

    // The window keeps its own reference to the PDF; release ours after a while.
    setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000);
    return true;
  } catch (error) {
    receiptWindow.close();
    toast.error('Could not generate the receipt PDF.');
    console.error(error);
    return false;
  }
}
