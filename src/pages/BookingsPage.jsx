import { zodResolver } from '@hookform/resolvers/zod';
import { Ban } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import BookingCalendar from '../components/BookingCalendar';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import UpiQrCode from '../components/UpiQrCode';
import { formatCurrency, formatDate, localeName } from '../utils/format';
import { openReceipt } from '../utils/generateReceipt';
import { bookingSchema } from '../validations/authSchemas';

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [sevas, setSevas] = useState([]);
  const [metadata, setMetadata] = useState({ gotras: [], nakshatras: [], raashis: [], paymentModes: [] });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [detailBooking, setDetailBooking] = useState(null);
  const [blockedDates, setBlockedDates] = useState({});
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
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
      paymentMode: 'Cash',
      amountPayable: 250,
      donation: 0,
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
  const selectedPaymentMode = watch('paymentMode');
  const amountPayableInput = watch('amountPayable');
  const donationInput = watch('donation');
  const bookingDateInput = watch('bookingDate');
  const totalToCollect = (Number(amountPayableInput) || 0) + (Number(donationInput) || 0);
  const isUpiPayment = String(selectedPaymentMode || '').trim().toLowerCase() === 'upi';

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

  // Dates on which bookings are closed (Ekadashi etc.), shown on the calendar and refused on click.
  useEffect(() => {
    api
      .get('/blocked-dates')
      .then((response) => setBlockedDates(Object.fromEntries(response.data.data.map((item) => [item.date, item.reason]))))
      .catch(() => {});
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

  const handleOpenCreate = (dateStr) => {
    reset();
    setValue('bookingDate', dateStr);
    setIsMultiSeva(false);
    setIsUpiModalOpen(false);
    setIsCreateOpen(true);
  };

  const handleUpiPaymentComplete = () => {
    // Close the QR modal and return to the booking form so the reference
    // number can be recorded before the booking is saved.
    setIsUpiModalOpen(false);
    setTimeout(() => setFocus('paymentReferenceNumber'), 0);
  };

  const openCancel = (booking) => {
    setCancelReason('');
    setCancelTarget(booking);
  };

  const closeCancel = () => {
    if (!cancelling) setCancelTarget(null);
  };

  const handleConfirmCancel = async (event) => {
    event.preventDefault();
    setCancelling(true);

    try {
      await api.post(`/bookings/${cancelTarget.id}/cancel`, { reason: cancelReason.trim() });
      toast.success(t('bookings.cancelledToast'));
      setCancelTarget(null);
      setDetailBooking(null);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || t('bookings.cancelFailed'));
    } finally {
      setCancelling(false);
    }
  };

  const handleEventClick = (bookingId) => {
    const found = bookings.find((b) => b.id === bookingId);
    if (found) setDetailBooking(found);
  };

  // Clicking a date on the calendar opens the booking form with that date locked in.
  const handleDateClick = (dateStr) => {
    const date = dateStr.slice(0, 10); // the week view reports date and time
    const reason = blockedDates[date];

    if (reason !== undefined) {
      toast.error(t('bookings.dateBlocked', { date: formatDate(date), reason: reason || t('blockedDates.blocked') }));
      return;
    }

    handleOpenCreate(date);
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
              onClick={() => openReceipt(booking)}
              className="rounded-lg bg-terracotta/10 px-3 py-1.5 text-xs font-semibold text-terracotta hover:bg-terracotta/20"
            >
              {t('common.viewReceipt')}
            </button>
            {booking.cancellable ? (
              <button
                type="button"
                onClick={() => openCancel(booking)}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
              >
                <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                {t('bookings.cancelBooking')}
              </button>
            ) : booking.status !== 'cancelled' ? (
              // The seva date has passed: the booking is frozen.
              <span
                className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-400"
                title={t('bookings.cancelClosedHint', { date: formatDate(booking.bookingDate) })}
              >
                <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                {t('bookings.cancelClosed')}
              </span>
            ) : null}
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
      _search: [booking.devotee?.mobileNumber, booking.cancellationReason].filter(Boolean).join(' '),
      bookingDate: booking.bookingDate,
      amountCollected: booking.amountCollected,
      status: booking.status,
    };
  });

  const cancelledCount = tableRows.filter((row) => row.status === 'cancelled').length;
  const visibleRows = tableRows.filter((row) =>
    statusFilter === 'all' ? true : statusFilter === 'cancelled' ? row.status === 'cancelled' : row.status !== 'cancelled',
  );

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
      />

      {/* Full-width calendar */}
      <BookingCalendar events={calendarEvents} onEventClick={handleEventClick} onDateClick={handleDateClick} blockedDates={blockedDates} blockedLabel={t('blockedDates.blocked')} />

      {/* Bookings table (search, sort and paging are built into the table) */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink">{t('bookings.allBookings')}</h2>
            <p className="mt-1 text-sm text-teak/80">{t('bookings.allBookingsSubtitle')}</p>
          </div>
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5" role="group" aria-label={t('common.status')}>
            {[
              ['all', t('bookings.filterAll'), tableRows.length],
              ['active', t('bookings.filterActive'), tableRows.length - cancelledCount],
              ['cancelled', t('bookings.filterCancelled'), cancelledCount],
            ].map(([value, label, count]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                aria-pressed={statusFilter === value}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === value ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-ink'
                }`}
              >
                {label} <span className="font-normal opacity-70">({count})</span>
              </button>
            ))}
          </div>
        </div>

        <DataTable
          key={statusFilter}
          columns={columns}
          rows={visibleRows}
          emptyText={t('bookings.emptyText')}
          searchPlaceholder={t('bookings.searchPlaceholder')}
          rowClassName={(row) => (row.status === 'cancelled' ? 'opacity-60' : '')}
        />
      </div>

      {/* Create booking modal */}
      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/45 px-4 py-8">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">{t('bookings.createBooking')}</h2>
                <p className="mt-1 text-sm text-slate-500">{t('bookings.formSubtitle')}</p>
                <p className="mt-2 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{t('bookings.bookingDate')}: {formatDate(bookingDateInput)}</p>
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
              <div className="md:col-span-2 rounded-lg border border-sandal/70 bg-sandal/20 px-4 py-3">
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

              {/* Devotee identity */}
              {[
                ['devoteeName', t('bookings.devoteeName'), 'text'],
                ['mobileNumber', t('bookings.mobileNumber'), 'text'],
                ['address', t('bookings.address'), 'text'],
              ].map(([name, label, type]) => (
                <label key={name} className="block text-sm font-semibold text-teak">
                  {label}
                  <input
                    {...register(name)}
                    type={type}
                    list={name === 'devoteeName' ? 'devotee-name-options' : undefined}
                    className="mt-2 w-full rounded-lg border border-sandal px-4 py-3"
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

              {/* Ritual details */}
              {[
                ['gotra', t('bookings.gotra'), metadata.gotras],
                ['nakshatra', t('bookings.nakshatra'), metadata.nakshatras],
                ['raashi', t('bookings.raashi'), metadata.raashis],
              ].map(([name, label, options]) => (
                <label key={name} className="block text-sm font-semibold text-teak">
                  {label}
                  <select {...register(name)} className="mt-2 w-full rounded-lg border border-sandal px-4 py-3">
                    <option value="">Select {label.toLowerCase()}</option>
                    {options.map((option) => (
                      <option key={option.id} value={option.name}>
                        {localeName(option, lang)}
                      </option>
                    ))}
                  </select>
                  {errors[name] ? <span className="mt-2 block text-xs text-terracotta">{errors[name].message}</span> : null}
                </label>
              ))}

              {/* Seva selection */}
              {isMultiSeva ? (
                <label className="block text-sm font-semibold text-teak md:col-span-2">
                  {t('bookings.seva')}
                  <div className="mt-2 grid gap-2 rounded-lg border border-sandal px-4 py-3 sm:grid-cols-2">
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
              ) : (
                <label className="block text-sm font-semibold text-teak md:col-span-2">
                  {t('bookings.seva')}
                  <select {...register('sevaId')} className="mt-2 w-full rounded-lg border border-sandal px-4 py-3">
                    <option value="">Select {t('bookings.seva').toLowerCase()}</option>
                    {sevas.map((option) => (
                      <option key={option.id} value={option.id}>
                        {localeName(option, lang)}
                      </option>
                    ))}
                  </select>
                  {errors.sevaId ? <span className="mt-2 block text-xs text-terracotta">{errors.sevaId.message}</span> : null}
                </label>
              )}

              {/* Booking date & amounts */}
              {[
                ['bookingDate', t('bookings.bookingDate'), 'date'],
                ['amountPayable', t('bookings.amountPayable'), 'number'],
                ['donation', t('bookings.donation'), 'number'],
              ].map(([name, label, type]) => (
                <label key={name} className={`block text-sm font-semibold text-teak ${name === 'bookingDate' ? 'md:col-span-2' : ''}`}>
                  {label}
                  {name === 'bookingDate' ? (
                    <>
                      {/* Frozen: the date comes from the calendar cell that was clicked. */}
                      <input
                        {...register(name)}
                        type="date"
                        readOnly
                        tabIndex={-1}
                        aria-readonly="true"
                        className="mt-2 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-slate-600 outline-none"
                      />
                      <span className="mt-1 block text-xs font-normal text-slate-500">{t('bookings.dateLockedHint')}</span>
                    </>
                  ) : (
                    <input
                      {...register(name)}
                      type={type}
                      min={type === 'number' ? 0 : undefined}
                      className="mt-2 w-full rounded-lg border border-sandal px-4 py-3"
                    />
                  )}
                  {errors[name] ? <span className="mt-2 block text-xs text-terracotta">{errors[name].message}</span> : null}
                </label>
              ))}

              <div className="md:col-span-2 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
                <span className="text-slate-600">{t('bookings.totalToCollect')}</span>
                <span className="text-base font-semibold text-ink">{formatCurrency(totalToCollect)}</span>
              </div>

              {/* Payment */}
              <label className="block text-sm font-semibold text-teak">
                {t('common.paymentMode')}
                <select {...register('paymentMode')} className="mt-2 w-full rounded-lg border border-sandal px-4 py-3">
                  <option value="">Select {t('common.paymentMode').toLowerCase()}</option>
                  {metadata.paymentModes.map((option) => (
                    <option key={option.id} value={option.name}>
                      {localeName(option, lang)}
                    </option>
                  ))}
                </select>
                {errors.paymentMode ? <span className="mt-2 block text-xs text-terracotta">{errors.paymentMode.message}</span> : null}
              </label>

              <label className="block text-sm font-semibold text-teak">
                {t('bookings.paymentRef')}
                <input
                  {...register('paymentReferenceNumber')}
                  type="text"
                  className="mt-2 w-full rounded-lg border border-sandal px-4 py-3"
                />
                {errors.paymentReferenceNumber ? <span className="mt-2 block text-xs text-terracotta">{errors.paymentReferenceNumber.message}</span> : null}
              </label>

              {/* UPI payment: open the QR in a modal stacked on top of this form */}
              {isUpiPayment ? (
                <div className="md:col-span-2 flex flex-col gap-3 rounded-lg border border-sandal bg-sandal/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-ink">{t('bookings.upiScanTitle')}</p>
                    <p className="mt-1 text-sm text-teak/80">{t('bookings.upiOpenHint')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsUpiModalOpen(true)}
                    className="shrink-0 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark"
                  >
                    {t('bookings.upiShowQr')}
                  </button>
                </div>
              ) : null}

              {/* Notes */}
              <label className="block text-sm font-semibold text-teak md:col-span-2">
                {t('common.notes')}
                <input {...register('notes')} className="mt-2 w-full rounded-lg border border-sandal px-4 py-3" />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end md:col-span-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg border border-sandal px-4 py-3 text-sm font-semibold text-ink"
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" className="rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white">
                  {t('bookings.saveAndIssue')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* UPI QR modal — stacked on top of the create booking modal */}
      {isCreateOpen && isUpiPayment && isUpiModalOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/55 px-4 py-6">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-ink">{t('bookings.upiScanTitle')}</h2>
                <p className="mt-1 text-xs text-teak/80">{t('bookings.upiScanSubtitle')}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsUpiModalOpen(false)}
                className="shrink-0 rounded-xl border border-sandal px-3 py-2 text-sm font-semibold text-ink hover:bg-sandal/40"
              >
                {t('common.close')}
              </button>
            </div>

            <div className="mt-5 flex flex-col items-center gap-3">
              <UpiQrCode />
              {totalToCollect > 0 ? (
                <p className="text-sm font-semibold text-ink">
                  {t('bookings.totalToCollect')}: {formatCurrency(totalToCollect)}
                </p>
              ) : null}
              <p className="inline-block rounded-full bg-marigold/25 px-3 py-1 text-xs font-semibold text-teak">
                {t('bookings.upiDummyBadge')}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsUpiModalOpen(false)}
                className="rounded-lg border border-sandal px-4 py-3 text-sm font-semibold text-ink"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleUpiPaymentComplete}
                className="rounded-lg bg-moss px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink"
              >
                {t('bookings.upiPaymentDone')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Booking detail modal */}
      {detailBooking ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/45 px-4 py-8">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-brand">{t('bookings.bookingDetails')}</p>
                <h2 className="mt-1 text-lg font-semibold text-ink">{detailBooking.devotee?.name}</h2>
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
                [t('bookings.donation'), formatCurrency(detailBooking.donation)],
                [t('bookings.amountCollected'), formatCurrency(detailBooking.amountCollected)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-teak/60">{label}</p>
                  <p className="mt-1 text-sm font-medium text-ink">{value || '—'}</p>
                </div>
              ))}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teak/60">Status</p>
                <div className="mt-1"><StatusBadge value={detailBooking.status} /></div>
              </div>
            </div>

            {detailBooking.address || detailBooking.devotee?.address ? (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-teak/60">{t('bookings.address')}</p>
                <p className="mt-1 text-sm font-medium text-ink">{detailBooking.devotee?.address || '—'}</p>
              </div>
            ) : null}

            {detailBooking.notes ? (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-teak/60">{t('common.notes')}</p>
                <p className="mt-1 text-sm font-medium text-ink">{detailBooking.notes}</p>
              </div>
            ) : null}

            {detailBooking.status === 'cancelled' ? (
              <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4" role="status">
                <p className="flex items-center gap-2 text-sm font-semibold text-rose-700">
                  <Ban className="h-4 w-4" aria-hidden="true" />
                  {t('bookings.cancelledBanner')}
                </p>
                <p className="mt-2 text-sm text-rose-900">{detailBooking.cancellationReason || t('bookings.noReason')}</p>
                {detailBooking.cancelledAt ? (
                  <p className="mt-1 text-xs text-rose-700">
                    {t('bookings.cancelledOnBy', {
                      date: new Date(detailBooking.cancelledAt).toLocaleString(),
                      user: detailBooking.cancelledBy || '—',
                    })}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 rounded-lg bg-sandal/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teak/60">{t('bookings.receiptNumber')}</p>
                <p className="mt-1 text-base font-semibold text-ink">{detailBooking.receiptNumber}</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => openReceipt(detailBooking)}
                  className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white"
                >
                  {t('common.viewReceipt')}
                </button>
                <button
                  type="button"
                  onClick={() => openReceipt(detailBooking, { print: true })}
                  className="rounded-xl border border-sandal px-4 py-2 text-sm font-semibold text-ink"
                >
                  {t('common.print')}
                </button>
                {detailBooking.cancellable ? (
                  <button
                    type="button"
                    onClick={() => openCancel(detailBooking)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    <Ban className="h-4 w-4" aria-hidden="true" />
                    {t('bookings.cancelBooking')}
                  </button>
                ) : null}
              </div>
            </div>
            {detailBooking.status !== 'cancelled' && !detailBooking.cancellable ? (
              <p className="mt-3 flex items-center gap-2 text-xs text-slate-500" role="note">
                <Ban className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {t('bookings.cancelClosedHint', { date: formatDate(detailBooking.bookingDate) })}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Cancel booking: confirmation with a required reason */}
      {cancelTarget ? (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-900/60 px-4 py-10" role="dialog" aria-modal="true" aria-label={t('bookings.cancelDialogTitle')}>
          <form onSubmit={handleConfirmCancel} className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                <Ban className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-ink">{t('bookings.cancelDialogTitle')}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {cancelTarget.receiptNumber} · {cancelTarget.devotee?.name} · {formatCurrency(cancelTarget.amountCollected)}
                </p>
              </div>
            </div>

            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              {t('bookings.cancelWarning', { amount: formatCurrency(cancelTarget.amountCollected) })}
            </p>
            <p className="mt-2 text-xs text-slate-500">{t('bookings.cancelDeadlineNote', { date: formatDate(cancelTarget.bookingDate) })}</p>

            <label className="mt-4 block text-sm font-medium text-slate-700">
              {t('bookings.reasonLabel')}
              <div className="mt-2 flex flex-wrap gap-2">
                {['reasonDevotee', 'reasonMistake', 'reasonNotPerformed', 'reasonDuplicate'].map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCancelReason(t(`bookings.${key}`))}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-brand hover:text-brand"
                  >
                    {t(`bookings.${key}`)}
                  </button>
                ))}
              </div>
              <textarea
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                placeholder={t('bookings.reasonPlaceholder')}
                rows={3}
                maxLength={500}
                required
                autoFocus
                className="mt-2 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeCancel}
                disabled={cancelling}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {t('bookings.keepBooking')}
              </button>
              <button
                type="submit"
                disabled={cancelling || cancelReason.trim().length < 3}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelling ? t('bookings.cancelling') : t('bookings.confirmCancel')}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
