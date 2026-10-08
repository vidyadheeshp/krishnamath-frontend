export const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

export const localeName = (item, lang) => {
  if (!item) return '';
  return lang === 'kn' && item.nameKn ? item.nameKn : item.name ?? '';
};

// 'YYYY-MM' (or a month number plus year) -> localized month name, e.g. "Jan" / "ಜನವರಿ".
export const monthLabel = (year, month, lang = 'en', style = 'short') =>
  new Intl.DateTimeFormat(lang === 'kn' ? 'kn-IN' : 'en-IN', { month: style }).format(new Date(Number(year), Number(month) - 1, 1));

export const formatCompactCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
