import { CalendarOff, Pencil, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { formatDate } from '../utils/format';

const pad = (value) => String(value).padStart(2, '0');
const dateKey = (year, month, day) => `${year}-${pad(month + 1)}-${pad(day)}`;
const todayKey = () => {
  const now = new Date();
  return dateKey(now.getFullYear(), now.getMonth(), now.getDate());
};

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20';

// One year at a glance: click a day to block it, click a blocked day to open it again.
function YearCalendar({ year, blocked, onToggle, busyDate, locale }) {
  const today = todayKey();
  const monthName = new Intl.DateTimeFormat(locale, { month: 'long' });
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
  // 2023-01-01 was a Sunday, so these seven dates are Sunday..Saturday.
  const weekdayLabels = Array.from({ length: 7 }, (_, index) => weekday.format(new Date(2023, 0, 1 + index)));

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 12 }, (_, month) => {
        const firstWeekday = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)];

        return (
          <section key={month} className="rounded-xl border border-slate-200 bg-white p-4 shadow-card" aria-label={monthName.format(new Date(year, month, 1))}>
            <h3 className="mb-2 text-sm font-semibold text-ink">{monthName.format(new Date(year, month, 1))}</h3>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-400">
              {weekdayLabels.map((label, index) => (
                <span key={index}>{label}</span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((day, index) => {
                if (day === null) return <span key={`blank-${index}`} />;

                const key = dateKey(year, month, day);
                const isBlocked = blocked.has(key);
                const isToday = key === today;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onToggle(key)}
                    disabled={busyDate === key}
                    aria-pressed={isBlocked}
                    aria-label={`${formatDate(key)}${isBlocked ? ` - ${blocked.get(key).reason || ''}` : ''}`}
                    title={isBlocked ? blocked.get(key).reason || undefined : undefined}
                    data-date={key}
                    className={`h-8 rounded-md text-xs font-medium transition disabled:opacity-50 ${
                      isBlocked ? 'bg-rose-500 text-white hover:bg-rose-600' : 'text-slate-700 hover:bg-indigo-50 hover:text-brand'
                    } ${isToday ? 'ring-2 ring-brand/60 ring-offset-1' : ''}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default function BlockedDatesPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'kn' ? 'kn-IN' : 'en-IN';
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [items, setItems] = useState([]);
  const [reason, setReason] = useState(t('blockedDates.defaultReason'));
  const [busyDate, setBusyDate] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editReason, setEditReason] = useState('');

  const years = useMemo(() => Array.from({ length: 5 }, (_, index) => currentYear - 1 + index), [currentYear]);
  const blocked = useMemo(() => new Map(items.map((item) => [item.date, item])), [items]);

  const load = async () => {
    try {
      const response = await api.get('/blocked-dates', { params: { year } });
      setItems(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || t('blockedDates.loadFailed'));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const toggleDate = async (key) => {
    setBusyDate(key);

    try {
      const existing = blocked.get(key);

      if (existing) {
        await api.delete(`/blocked-dates/${existing.id}`);
        toast.success(t('blockedDates.reopened', { date: formatDate(key) }));
      } else {
        const response = await api.post('/blocked-dates', { dates: [key], reason: reason.trim() });
        const created = response.data.data.items[0];
        toast.success(t('blockedDates.blockedToast', { date: formatDate(key) }));

        if (created?.activeBookings > 0) {
          toast.warning(t('blockedDates.existingWarning', { count: created.activeBookings, date: formatDate(key) }), { duration: 8000 });
        }
      }

      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || t('blockedDates.saveFailed'));
    } finally {
      setBusyDate(null);
    }
  };

  const handleRemove = async (item) => {
    if (!window.confirm(t('blockedDates.confirmRemove', { date: formatDate(item.date) }))) return;
    await toggleDate(item.date);
  };

  const openEdit = (item) => {
    setEditing(item);
    setEditReason(item.reason);
  };

  const handleEditSave = async (event) => {
    event.preventDefault();

    try {
      await api.put(`/blocked-dates/${editing.id}`, { reason: editReason.trim() });
      toast.success(t('blockedDates.saved'));
      setEditing(null);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || t('blockedDates.saveFailed'));
    }
  };

  const weekdayFormatter = new Intl.DateTimeFormat(locale, { weekday: 'long' });

  const columns = [
    {
      key: 'date',
      header: t('common.date'),
      render: (value) => (
        <span className="whitespace-nowrap font-medium text-ink">
          {formatDate(value)} <span className="font-normal text-slate-500">· {weekdayFormatter.format(new Date(`${value}T00:00:00`))}</span>
        </span>
      ),
    },
    { key: 'reason', header: t('blockedDates.reason'), render: (value) => value || <span className="text-slate-400">—</span> },
    {
      key: 'activeBookings',
      header: t('blockedDates.existingBookings'),
      render: (value) =>
        value > 0 ? (
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">{value}</span>
        ) : (
          '0'
        ),
    },
    { key: 'createdBy', header: t('blockedDates.addedBy') },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (_value, row) => (
        <div className="flex gap-2">
          <button type="button" onClick={() => openEdit(row)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            {t('common.edit')}
          </button>
          <button type="button" onClick={() => handleRemove(row)} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50">
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {t('blockedDates.remove')}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t('blockedDates.title')} description={t('blockedDates.description')} />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-end gap-4">
          <label className="block text-sm font-medium text-slate-700">
            {t('blockedDates.year')}
            <select value={year} onChange={(event) => setYear(Number(event.target.value))} className={`${inputClass} mt-1.5 w-32`}>
              {years.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block min-w-[240px] flex-1 text-sm font-medium text-slate-700">
            {t('blockedDates.reasonLabel')}
            <input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={200} className={`${inputClass} mt-1.5`} placeholder={t('blockedDates.defaultReason')} />
          </label>
          <p className="flex items-center gap-2 text-sm font-medium text-ink">
            <CalendarOff className="h-4 w-4 text-rose-500" aria-hidden="true" />
            {t('blockedDates.count', { count: items.length, year })}
          </p>
        </div>
        <p className="mt-3 text-sm text-slate-500">{t('blockedDates.tapHint')}</p>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-rose-500" aria-hidden="true" /> {t('blockedDates.legendBlocked')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded ring-2 ring-brand/60" aria-hidden="true" /> {t('blockedDates.legendToday')}
          </span>
        </div>
      </section>

      <YearCalendar year={year} blocked={blocked} onToggle={toggleDate} busyDate={busyDate} locale={locale} />

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-ink">{t('blockedDates.listTitle', { year })}</h2>
        <DataTable columns={columns} rows={items} emptyText={t('blockedDates.empty')} searchPlaceholder={t('blockedDates.searchPlaceholder')} />
      </section>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form onSubmit={handleEditSave} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">{t('blockedDates.editReason')}</h2>
                <p className="mt-1 text-sm text-slate-500">{formatDate(editing.date)}</p>
              </div>
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label={t('common.close')}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <input value={editReason} onChange={(event) => setEditReason(event.target.value)} maxLength={200} className={inputClass} autoFocus />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                {t('common.cancel')}
              </button>
              <button type="submit" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                {t('common.save')}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
