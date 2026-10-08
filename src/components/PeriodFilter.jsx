import { useTranslation } from 'react-i18next';

import { monthLabel } from '../utils/format';

const selectClass =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20';

export default function PeriodFilter({ year, month, years, onChange, allowAllMonths = true }) {
  const { t, i18n } = useTranslation();
  const yearOptions = years?.length ? years : [year];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label={t('finance.year')}
        value={year}
        onChange={(event) => onChange({ year: Number(event.target.value) })}
        className={selectClass}
      >
        {yearOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {allowAllMonths ? (
        <select
          aria-label={t('finance.month')}
          value={month}
          onChange={(event) => onChange({ month: Number(event.target.value) })}
          className={selectClass}
        >
          <option value={0}>{t('finance.allMonths')}</option>
          {Array.from({ length: 12 }, (_, index) => (
            <option key={index + 1} value={index + 1}>
              {monthLabel(year, index + 1, i18n.language, 'long')}
            </option>
          ))}
        </select>
      ) : null}
    </div>
  );
}
