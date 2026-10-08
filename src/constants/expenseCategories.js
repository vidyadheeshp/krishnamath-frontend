// Expenditure heads. The stored value is the English label (it is also the Tally "particulars").
export const EXPENSE_CATEGORIES = ['Maintenance', 'Salaries', 'Daily Expenses', 'Dakshine and Sambhavane', 'Donation Paid'];

const KEYS = {
  Maintenance: 'maintenance',
  Salaries: 'salaries',
  'Daily Expenses': 'daily-expenses',
  'Dakshine and Sambhavane': 'dakshine-sambhavane',
  'Donation Paid': 'donation-paid',
};

export const EXPENSE_COLORS = {
  Maintenance: '#e11d48',
  Salaries: '#f97316',
  'Daily Expenses': '#8b5cf6',
  'Dakshine and Sambhavane': '#14b8a6',
  'Donation Paid': '#64748b',
};

// Translated head name; unknown legacy values are shown as stored.
export const expenseCategoryLabel = (t, value) => (KEYS[value] ? t(`expenseCategories.${KEYS[value]}`, value) : value);
