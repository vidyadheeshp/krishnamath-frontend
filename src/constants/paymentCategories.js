// The five heads under which every rupee received is accounted (mirrors the API).
export const CATEGORIES = {
  RELIGIOUS_SEVA: 'religious-seva',
  ANNADANA_SEVA: 'annadana-seva',
  DONATION: 'donation',
  HUNDI_COLLECTION: 'hundi-collection',
  STHALA_KANIKE: 'sthala-kanike',
};

export const ALL_CATEGORIES = Object.values(CATEGORIES);

// Categories an admin records directly on the Receipts screen (seva bookings are Religious Seva).
export const RECEIPT_CATEGORIES = [CATEGORIES.ANNADANA_SEVA, CATEGORIES.DONATION, CATEGORIES.HUNDI_COLLECTION, CATEGORIES.STHALA_KANIKE];

// English names used on printed receipts (the PDF fonts cannot render Kannada).
export const CATEGORY_NAMES = {
  [CATEGORIES.RELIGIOUS_SEVA]: 'Religious Seva',
  [CATEGORIES.ANNADANA_SEVA]: 'Annadana Seva',
  [CATEGORIES.DONATION]: 'Donation',
  [CATEGORIES.HUNDI_COLLECTION]: 'Hundi Collection',
  [CATEGORIES.STHALA_KANIKE]: 'Sthala Kanike',
};

// Same colour for a category in every chart and badge.
export const CATEGORY_COLORS = {
  [CATEGORIES.RELIGIOUS_SEVA]: '#4f46e5',
  [CATEGORIES.ANNADANA_SEVA]: '#f59e0b',
  [CATEGORIES.DONATION]: '#10b981',
  [CATEGORIES.HUNDI_COLLECTION]: '#0ea5e9',
  [CATEGORIES.STHALA_KANIKE]: '#ec4899',
};

export const categoryKey = (category) => `categories.${category}`;
