import { useTranslation } from 'react-i18next';

import { CATEGORY_COLORS, categoryKey } from '../constants/paymentCategories';

export default function CategoryBadge({ category }) {
  const { t } = useTranslation();
  const color = CATEGORY_COLORS[category] || '#64748b';

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
      {t(categoryKey(category), category)}
    </span>
  );
}
