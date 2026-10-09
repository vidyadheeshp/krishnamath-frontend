import { CalendarCheck, FileText, Info, Printer, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { masaName, panchangLimbs } from '../constants/panchang';
import { openSevaListPdf } from '../utils/generateSevaList';
import { localeName } from '../utils/format';

const DAYS = ['today', 'tomorrow'];

export default function SevaListPage() {
  const { t, i18n } = useTranslation();
  const [day, setDay] = useState('today');
  const [list, setList] = useState(null);
  const [dates, setDates] = useState(null);

  useEffect(() => {
    let cancelled = false;

    api
      .get('/seva-list', { params: { day } })
      .then((response) => {
        if (cancelled) return;
        setList(response.data.data);
        setDates(response.data.data.dates);
      })
      .catch((error) => toast.error(error.response?.data?.message || t('sevaList.loadFailed')));

    return () => {
      cancelled = true;
    };
  }, [day, t]);

  const locale = i18n.language === 'kn' ? 'kn-IN' : 'en-IN';
  const formatLong = (isoDate) =>
    new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${isoDate}T12:00:00`));

  const rows = useMemo(
    () => (list?.entries || []).map((entry) => ({ ...entry, sevaNames: entry.sevas.map((seva) => localeName(seva, i18n.language)).join(', ') })),
    [list, i18n.language],
  );

  const columns = [
    { key: 'slNo', header: t('common.slNo') },
    { key: 'name', header: t('sevaList.name'), render: (value) => <span className="font-semibold text-ink">{value}</span> },
    { key: 'gotra', header: t('bookings.gotra'), render: (value) => value || '-' },
    { key: 'nakshatra', header: t('bookings.nakshatra'), render: (value) => value || '-' },
    { key: 'raashi', header: t('bookings.raashi'), render: (value) => value || '-' },
    { key: 'sevaNames', header: t('sevaList.sevasBooked') },
  ];

  const hasEntries = (list?.entries.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('sevaList.title')}
        description={t('sevaList.description')}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!hasEntries}
              onClick={() => openSevaListPdf(list)}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileText className="h-4 w-4" aria-hidden="true" />
              {t('sevaList.openPdf')}
            </button>
            <button
              type="button"
              disabled={!hasEntries}
              onClick={() => openSevaListPdf(list, { print: true })}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              {t('common.print')}
            </button>
          </div>
        }
      />

      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-card" role="tablist" aria-label={t('sevaList.day')}>
        {DAYS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={day === value}
            onClick={() => setDay(value)}
            className={`rounded-md px-5 py-2 text-sm font-semibold transition ${day === value ? 'bg-brand text-white' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            {t(`sevaList.${value}`)}
            {dates ? <span className="ml-2 text-xs font-normal opacity-80">{new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(`${dates[value]}T12:00:00`))}</span> : null}
          </button>
        ))}
      </div>

      {list ? (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-card">
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">{t(`sevaList.${list.day}`)}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{formatLong(list.date)}</h2>
            {list.panchang ? (
              <div className="mx-auto mt-4 max-w-3xl">
                <p className="text-sm font-semibold text-slate-700">{masaName(list.panchang.masa, list.panchang.adhika, i18n.language)} {t('panchang.masa')}</p>
                <dl className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 sm:grid-cols-5">
                  {panchangLimbs(list.panchang, i18n.language).map((limb) => (
                    <div key={limb.key} className="bg-white px-3 py-2">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t(`panchang.${limb.key}`)}</dt>
                      <dd className="mt-0.5 text-sm font-semibold text-ink">{limb.value}</dd>
                      {limb.until ? <dd className="text-xs text-slate-500">{t('panchang.until', { time: limb.until })}</dd> : null}
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
            {list.blockedReason ? (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700">
                <Info className="h-4 w-4" aria-hidden="true" />
                {t('sevaList.blockedNote', { reason: list.blockedReason })}
              </p>
            ) : null}
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label={t('sevaList.bookings')} value={list.totals.bookings} icon={CalendarCheck} tone="brand" />
            <StatCard label={t('sevaList.sevasToPerform')} value={list.totals.sevas} icon={Sparkles} tone="warm" />
          </div>

          <DataTable key={day} columns={columns} rows={rows} pageSize={0} emptyText={t('sevaList.empty')} searchPlaceholder={t('sevaList.searchPlaceholder')} />

          {list.sevaCounts.length > 0 ? (
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="text-base font-semibold text-ink">{t('sevaList.sevaWiseCount')}</h2>
              <div className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                {list.sevaCounts.map((item) => (
                  <div key={item.name} className="flex items-center justify-between border-b border-slate-100 py-1.5 text-sm">
                    <span className="text-slate-700">{localeName(item, i18n.language)}</span>
                    <span className="font-semibold text-ink">{item.count}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
