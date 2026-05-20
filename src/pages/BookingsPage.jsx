import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import BookingCalendar from '../components/BookingCalendar';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatDate, localeName } from '../utils/format';
import { generateReceipt } from '../utils/generateReceipt';
import { bookingSchema } from '../validations/authSchemas';

const PAGE_SIZE = 10;

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [sevas, setSevas] = useState([]);
  const [metadata, setMetadata] = useState({ gotras: [], nakshatras: [], raashis: [], paymentModes: [] });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailBooking, setDetailBooking] = useState(null);
  const [dayBookings, setDayBookings] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMultiSeva, setIsMultiSeva] = useState(false);
  const { t, i18n: i18nInst } = useTranslation();
  const lang = i18nInst.language;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setFocus,
    watch,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      devoteeName: '',
      mobileNumber: '',
      sevaId: '',
      sevaIds: [],
      bookingDate: new Date().toISOString().slice(0, 10),
      bookingTime: '09:00',
      paymentMode: 'Cash',
      amountPayable: 250,
      discount: 0,
      address: '',
      gotra: '',
      nakshatra: '',
      raashi: '',
      paymentReferenceNumber: '',
      notes: '',
    },
  });

  const selectedSevaId = watch('sevaId');
  const selectedSevaIds = watch('sevaIds') || [];
  const devoteeNameInput = watch('devoteeName');

  const getBookingSevas = (booking) => (Array.isArray(booking?.sevas) && booking.sevas.length > 0 ? booking.sevas : booking?.seva ? [booking.seva] : []);

  const knownDevotees = useMemo(() => {
    const byName = new Map();

    bookings.forEach((booking) => {
      const devotee = booking.devotee;
      const normalizedName = devotee?.name?.trim().toLowerCase();

      if (!normalizedName) {
        return;
      }

      const existing = byName.get(normalizedName);
      const next = {
        name: devotee.name,
        mobileNumber: devotee.mobileNumber || '',
        address: devotee.address || '',
        gotra: devotee.gotra || '',
        nakshatra: devotee.nakshatra || '',
        raashi: devotee.raashi || '',
      };

      if (!existing) {
        byName.set(normalizedName, next);
        return;
      }

      // Preserve already known values and backfill any missing fields from later records.
      byName.set(normalizedName, {
        ...next,
        ...existing,
        mobileNumber: existing.mobileNumber || next.mobileNumber,
        address: existing.address || next.address,
        gotra: existing.gotra || next.gotra,
        nakshatra: existing.nakshatra || next.nakshatra,
        raashi: existing.raashi || next.raashi,
      });
    });

    return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [bookings]);

  const loadData = async () => {
    try {
      const [bookingsResponse, sevasResponse, gotrasResponse, nakshatrasResponse, raashisResponse, paymentModesResponse] = await Promise.all([
        api.get('/bookings'),
        api.get('/sevas'),
        api.get('/metadata/gotras'),
        api.get('/metadata/nakshatras'),
        api.get('/metadata/raashis'),
        api.get('/metadata/paymentModes'),
      ]);

      setBookings(bookingsResponse.data.data);
      setSevas(sevasResponse.data.data);
      setMetadata({
        gotras: gotrasResponse.data.data,
        nakshatras: nakshatrasResponse.data.data,
        raashis: raashisResponse.data.data,
        paymentModes: paymentModesResponse.data.data,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load booking data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (isMultiSeva) {
      const total = sevas
        .filter((item) => selectedSevaIds.includes(item.id))
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

      if (total > 0) {
        setValue('amountPayable', total, { shouldDirty: true });
      }

      return;
    }

    const selectedSeva = sevas.find((item) => item.id === selectedSevaId);
    if (selectedSeva) {
      setValue('amountPayable', selectedSeva.amount, { shouldDirty: true });
    }
  }, [isMultiSeva, selectedSevaId, selectedSevaIds, sevas, setValue]);

  useEffect(() => {
    const normalizedName = devoteeNameInput?.trim().toLowerCase();

    if (!normalizedName) {
      return;
    }

    const matchedDevotee = knownDevotees.find((devotee) => devotee.name.trim().toLowerCase() === normalizedName);

    if (!matchedDevotee) {
      return;
    }

    ['mobileNumber', 'address', 'gotra', 'nakshatra', 'raashi'].forEach((field) => {
      if (matchedDevotee[field] && getValues(field) !== matchedDevotee[field]) {
        setValue(field, matchedDevotee[field], { shouldDirty: true });
      }
    });

    if (!isMultiSeva) {
      setFocus('sevaId');
    }
  }, [devoteeNameInput, getValues, isMultiSeva, knownDevotees, setFocus, setValue]);

  const onSubmit = async (values) => {
    try {
      const normalizedSevaIds = isMultiSeva
        ? (values.sevaIds || []).filter(Boolean)
        : [values.sevaId].filter(Boolean);

      const payload = {
        ...values,
        sevaId: normalizedSevaIds[0] || '',
        sevaIds: normalizedSevaIds,
      };

      const response = await api.post('/bookings', payload);
      const booking = response.data.data;
      toast.success(`Receipt ${booking.receiptNumber} created`);
      reset();
      setIsMultiSeva(false);
      setIsCreateOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create booking');
    }
  };

  const handleOpenCreate = () => {
    reset();
    setIsMultiSeva(false);
    setIsCreateOpen(true);
  };

  const handleEventClick = (bookingId) => {
    const found = bookings.find((b) => b.id === bookingId);
    if (found) setDetailBooking(found);
  };

  const handleDateClick = (dateStr) => {
    const matched = bookings.filter((b) => b.bookingDate === dateStr && b.status !== 'cancelled');
    setSelectedDay(dateStr);
    setDayBookings(matched);
  };

  const columns = useMemo(
    () => [
      { key: 'receiptNumber', header: t('bookings.receipt') },
      { key: 'devoteeName', header: t('bookings.devotee') },
      { key: 'sevaName', header: t('bookings.seva') },
      { key: 'bookingDate', header: t('common.date'), render: (value) => formatDate(value) },
      { key: 'amountCollected', header: t('bookings.collected'), render: (value) => formatCurrency(value) },
      { key: 'status', header: t('common.status') },
      {
        key: '_booking',
        header: t('common.actions'),
        render: (booking) => (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDetailBooking(booking)}
              className="rounded-lg border border-sandal px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sandal/40"
            >
              {t('common.view')}
            </button>
            <button
              type="button"
              onClick={() => generateReceipt(booking)}
              className="rounded-lg bg-terracotta/10 px-3 py-1.5 text-xs font-semibold text-terracotta hover:bg-terracotta/20"
            >
              {t('common.downloadPDF')}
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  const tableRows = bookings.map((booking) => {
    const sevaNames = getBookingSevas(booking).map((seva) => localeName(seva, lang));

    return {
      id: booking.id,
      _booking: booking,
      receiptNumber: booking.receiptNumber,
      devoteeName: booking.devotee?.name,
      sevaName: sevaNames.join(', '),
      bookingDate: booking.bookingDate,
      amountCollected: booking.amountCollected,
      status: booking.status,
    };
  });

  const totalPages = Math.max(1, Math.ceil(tableRows.length / PAGE_SIZE));
  const paginatedRows = tableRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const calendarEvents = bookings.map((booking) => {
    const sevaNames = getBookingSevas(booking).map((seva) => localeName(seva, lang));

    return {
      id: booking.id,
      title: `${booking.devotee?.name} • ${sevaNames[0] || ''}${sevaNames.length > 1 ? ` (+${sevaNames.length - 1})` : ''}`,
      start: `${booking.bookingDate}T${booking.bookingTime}`,
      color: booking.status === 'cancelled' ? '#ad4c34' : '#4f6f52',
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('bookings.title')}
        description={t('bookings.description')}
        action={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:bg-teak"
          >
            {t('bookings.createBooking')}
          </button>
        }
      />

      {/* Full-width calendar */}
      <BookingCalendar events={calendarEvents} onEventClick={handleEventClick} onDateClick={handleDateClick} />

      {/* Bookings table with pagination */}
      <div className="rounded-[1.75rem] border border-white/70 bg-white p-6 shadow-card">
        <div className="mb-5">
          <h2 className="font-serif text-2xl text-ink">{t('bookings.allBookings')}</h2>
          <p className="mt-1 text-sm text-teak/80">{t('bookings.allBookingsSubtitle')}</p>
        </div>

        <DataTable columns={columns} rows={paginatedRows} emptyText={t('bookings.emptyText')} />

        <div className="mt-5 flex flex-col gap-3 border-t border-stone-100 pt-5 text-sm text-teak/80 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {t('common.showing')}{' '}
            {tableRows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}
            {' '}{t('common.to')}{' '}
            {Math.min(currentPage * PAGE_SIZE, tableRows.length)} {t('common.of')} {tableRows.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-xl border border-sandal px-4 py-2 font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.prev')}
            </button>
            <span className="min-w-[88px] text-center font-semibold text-ink">
              {t('common.page')} {currentPage} {t('common.of')} {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-xl border border-sandal px-4 py-2 font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      </div>

      {/* Day bookings modal */}
      {dayBookings !== null ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/45 px-4 py-8">
          <div className="w-full max-w-2xl rounded-[1.75rem] border border-white/70 bg-white p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-terracotta/70">{t('bookings.dayView')}</p>
                <h2 className="mt-1 font-serif text-2xl text-ink">{formatDate(selectedDay)}</h2>
                <p className="mt-1 text-sm text-teak/70">{dayBookings.length} {t(dayBookings.length !== 1 ? 'bookings.booking_other' : 'bookings.booking_one')}</p>
              </div>
              <button
                type="button"
                onClick={() => setDayBookings(null)}
                className="shrink-0 rounded-xl border border-sandal px-3 py-2 text-sm font-semibold text-ink hover:bg-sandal/40"
              >
                ✕ {t('common.close')}
              </button>
            </div>

            {dayBookings.length === 0 ? (
              <p className="mt-6 text-sm text-teak/60">{t('bookings.noBookingsForDay')}</p>
            ) : (
              <div className="mt-5 space-y-3">
                {dayBookings.map((b) => (
                  <div key={b.id} className="rounded-2xl border border-sandal/60 bg-sandal/20 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink truncate">{b.devotee?.name}</p>
                        <p className="text-sm text-teak/70 truncate">{getBookingSevas(b).map((seva) => localeName(seva, lang)).join(', ')}</p>
                        <p className="text-xs text-teak/50 mt-0.5">{b.bookingTime} &nbsp;·&nbsp; {formatCurrency(b.amountCollected)} &nbsp;·&nbsp; {b.paymentMode}</p>
                        <p className="text-xs text-teak/50">Receipt: {b.receiptNumber}</p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => { setDayBookings(null); setDetailBooking(b); }}
                          className="rounded-xl border border-sandal px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sandal/40"
                        >
                          {t('common.view')}
                        </button>
                        <button
                          type="button"
                          onClick={() => generateReceipt(b)}
                          className="rounded-xl border border-terracotta/40 px-3 py-1.5 text-xs font-semibold text-terracotta hover:bg-terracotta/10"
                        >
                          {t('common.downloadPDF')}
                        </button>
                        <button
                          type="button"
                          onClick={() => { generateReceipt(b); setTimeout(() => window.print(), 800); }}
                          className="rounded-xl border border-sandal px-3 py-1.5 text-xs font-semibold text-ink hover:bg-sandal/40"
                        >
                          {t('common.print')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Create booking modal */}
      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/45 px-4 py-8">
          <div className="w-full max-w-2xl rounded-[1.75rem] border border-white/70 bg-white p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl text-ink">{t('bookings.createBooking')}</h2>
                <p className="mt-1 text-sm text-teak/80">{t('bookings.formSubtitle')}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl border border-sandal px-3 py-2 text-sm font-semibold text-ink"
              >
                {t('common.close')}
              </button>
            </div>

            <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
              <div className="md:col-span-2 rounded-2xl border border-sandal/70 bg-sandal/20 px-4 py-3">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
                  <input
                    type="checkbox"
                    checked={isMultiSeva}
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setIsMultiSeva(checked);

                      if (checked) {
                        setValue('sevaId', '');
                      } else {
                        setValue('sevaIds', []);
                      }
                    }}
                  />
                  Book multiple sevas in one booking
                </label>
                <p className="mt-1 text-xs text-teak/70">Turn this on to select multiple sevas and issue one combined receipt.</p>
              </div>

              {[
                ['devoteeName', t('bookings.devoteeName'), 'text'],
                ['mobileNumber', t('bookings.mobileNumber'), 'text'],
                ['address', t('bookings.address'), 'text'],
                ['bookingDate', t('bookings.bookingDate'), 'date'],
                ['bookingTime', t('bookings.bookingTime'), 'time'],
                ['amountPayable', t('bookings.amountPayable'), 'number'],
                ['discount', t('bookings.discount'), 'number'],
                ['paymentReferenceNumber', t('bookings.paymentRef'), 'text'],
              ].map(([name, label, type]) => (
                <label key={name} className="block text-sm font-semibold text-teak">
                  {label}
                  <input
                    {...register(name)}
                    type={type}
                    list={name === 'devoteeName' ? 'devotee-name-options' : undefined}
                    className="mt-2 w-full rounded-2xl border border-sandal px-4 py-3"
                  />
                  {name === 'devoteeName' ? (
                    <datalist id="devotee-name-options">
                      {knownDevotees.map((devotee) => (
                        <option key={devotee.name} value={devotee.name} />
                      ))}
                    </datalist>
                  ) : null}
                  {errors[name] ? <span className="mt-2 block text-xs text-terracotta">{errors[name].message}</span> : null}
                </label>
              ))}

              {isMultiSeva ? (
                <label className="block text-sm font-semibold text-teak md:col-span-2">
                  {t('bookings.seva')}
                  <div className="mt-2 grid gap-2 rounded-2xl border border-sandal px-4 py-3 sm:grid-cols-2">
                    {sevas.map((seva) => (
                      <label key={seva.id} className="inline-flex items-start gap-2 text-sm font-medium text-ink">
                        <input type="checkbox" value={seva.id} {...register('sevaIds')} className="mt-0.5" />
                        <span>
                          {localeName(seva, lang)}
                          <span className="ml-2 text-teak/70">({formatCurrency(seva.amount)})</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.sevaId ? <span className="mt-2 block text-xs text-terracotta">{errors.sevaId.message}</span> : null}
                </label>
              ) : null}

              {[
                ['gotra', t('bookings.gotra'), metadata.gotras],
                ['nakshatra', t('bookings.nakshatra'), metadata.nakshatras],
                ['raashi', t('bookings.raashi'), metadata.raashis],
                ['paymentMode', t('common.paymentMode'), metadata.paymentModes],
              ].map(([name, label, options]) => (
                <label key={name} className="block text-sm font-semibold text-teak">
                  {label}
                  <select {...register(name)} className="mt-2 w-full rounded-2xl border border-sandal px-4 py-3">
                    <option value="">Select {label.toLowerCase()}</option>
                    {options.map((option) => (
                      <option key={option.id} value={name === 'sevaId' ? option.id : option.name}>
                        {localeName(option, lang)}
                      </option>
                    ))}
                  </select>
                  {errors[name] ? <span className="mt-2 block text-xs text-terracotta">{errors[name].message}</span> : null}
                </label>
              ))}

              {!isMultiSeva ? (
                <label className="block text-sm font-semibold text-teak">
                  {t('bookings.seva')}
                  <select {...register('sevaId')} className="mt-2 w-full rounded-2xl border border-sandal px-4 py-3">
                    <option value="">Select {t('bookings.seva').toLowerCase()}</option>
                    {sevas.map((option) => (
                      <option key={option.id} value={option.id}>
                        {localeName(option, lang)}
                      </option>
                    ))}
                  </select>
                  {errors.sevaId ? <span className="mt-2 block text-xs text-terracotta">{errors.sevaId.message}</span> : null}
                </label>
              ) : null}

              <label className="block text-sm font-semibold text-teak md:col-span-2">
                {t('common.notes')}
                <input {...register('notes')} className="mt-2 w-full rounded-2xl border border-sandal px-4 py-3" />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end md:col-span-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-2xl border border-sandal px-4 py-3 text-sm font-semibold text-ink"
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white">
                  {t('bookings.saveAndIssue')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Booking detail modal */}
      {detailBooking ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/45 px-4 py-8">
          <div className="w-full max-w-2xl rounded-[1.75rem] border border-white/70 bg-white p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-terracotta/70">{t('bookings.bookingDetails')}</p>
                <h2 className="mt-1 font-serif text-2xl text-ink">{detailBooking.devotee?.name}</h2>
              </div>
              <button
                type="button"
                onClick={() => setDetailBooking(null)}
                className="shrink-0 rounded-xl border border-sandal px-3 py-2 text-sm font-semibold text-ink hover:bg-sandal/40"
              >
                ✕ {t('common.close')}
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              {[
                [t('bookings.seva'), getBookingSevas(detailBooking).map((seva) => localeName(seva, lang)).join(', ')],
                [t('bookings.bookingDate'), formatDate(detailBooking.bookingDate)],
                [t('bookings.bookingTime'), detailBooking.bookingTime],
                [t('bookings.mobile'), detailBooking.devotee?.mobileNumber],
                [t('bookings.gotra'), detailBooking.devotee?.gotra],
                [t('bookings.nakshatra'), detailBooking.devotee?.nakshatra],
                [t('bookings.raashi'), detailBooking.devotee?.raashi],
                [t('common.paymentMode'), detailBooking.paymentMode],
                [t('bookings.reference'), detailBooking.paymentReferenceNumber || '—'],
                [t('bookings.amountPayable'), formatCurrency(detailBooking.amountPayable)],
                [t('bookings.discount'), formatCurrency(detailBooking.discount)],
                [t('bookings.amountCollected'), formatCurrency(detailBooking.amountCollected)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teak/60">{label}</p>
                  <p className="mt-1 text-sm font-medium text-ink">{value || '—'}</p>
                </div>
              ))}
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teak/60">Status</p>
                <div className="mt-1"><StatusBadge value={detailBooking.status} /></div>
              </div>
            </div>

            {detailBooking.address || detailBooking.devotee?.address ? (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teak/60">{t('bookings.address')}</p>
                <p className="mt-1 text-sm font-medium text-ink">{detailBooking.devotee?.address || '—'}</p>
              </div>
            ) : null}

            {detailBooking.notes ? (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teak/60">{t('common.notes')}</p>
                <p className="mt-1 text-sm font-medium text-ink">{detailBooking.notes}</p>
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-sandal/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teak/60">{t('bookings.receiptNumber')}</p>
                <p className="mt-1 font-serif text-xl text-ink">{detailBooking.receiptNumber}</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => generateReceipt(detailBooking)}
                  className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white"
                >
                  {t('common.downloadPDF')}
                </button>
                <button
                  type="button"
                  onClick={() => { window.print(); }}
                  className="rounded-xl border border-sandal px-4 py-2 text-sm font-semibold text-ink"
                >
                  {t('common.print')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
