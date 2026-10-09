import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import api from '../api/client';
import { masaName, nakshatraName, pakshaName, tithiName } from '../constants/panchang';

const pad = (value) => String(value).padStart(2, '0');
const keyOf = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const TAG_CLASS = { major: 'fc-pan-festival', ekadashi: 'fc-pan-ekadashi' };

// `blockedDates` maps 'YYYY-MM-DD' -> reason for the days on which no bookings are accepted.
// Each day of the month view also shows its Hindu calendar (panchang) details, fetched for the visible days only.
export default function BookingCalendar({ events, onEventClick, onDateClick, blockedDates = {}, blockedLabel = 'Blocked' }) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [panchang, setPanchang] = useState({});
  const requested = useRef(new Set());
  const isBlocked = (date) => blockedDates[keyOf(date)] !== undefined;

  const loadPanchang = useCallback((info) => {
    const from = keyOf(info.start);
    const to = keyOf(info.end);
    const rangeKey = `${from}/${to}`;
    if (requested.current.has(rangeKey)) return;
    requested.current.add(rangeKey);

    api
      .get('/panchang', { params: { from, to } })
      .then((response) => setPanchang((current) => ({ ...current, ...response.data.data })))
      .catch(() => requested.current.delete(rangeKey)); // the calendar still works without the panchang
  }, []);

  const panchangFor = (date) => {
    const day = panchang[keyOf(date)];
    if (!day) return null;

    const month = masaName(day.masa, day.adhika, lang);
    const tithi = `${pakshaName(day.paksha, lang)} ${tithiName(day.tithi, lang)}`;
    const nakshatra = nakshatraName(day.nakshatra, lang);
    const prathama = day.tithi === 0 || day.tithi === 15; // a new fortnight: say which month it is
    const title = [
      `${month} · ${tithi}${day.tithiEnd ? ` (→ ${day.tithiEnd})` : ''}`,
      `${nakshatra}${day.nakshatraEnd ? ` (→ ${day.nakshatraEnd})` : ''}`,
      ...day.festivals.map((festival) => festival.name),
    ].join('\n');

    return { day, tithi: prathama ? `${month} ${tithi}` : tithi, nakshatra, title };
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-card">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        height="auto"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek',
        }}
        events={events}
        datesSet={loadPanchang}
        eventClick={onEventClick ? (info) => { info.jsEvent.preventDefault(); onEventClick(info.event.id); } : undefined}
        eventCursor={onEventClick ? 'pointer' : undefined}
        dateClick={onDateClick ? (info) => onDateClick(info.dateStr) : undefined}
        dayCellClassNames={(arg) => (isBlocked(arg.date) ? ['fc-blocked-day'] : [])}
        dayCellContent={(arg) => {
          const info = arg.view.type === 'dayGridMonth' ? panchangFor(arg.date) : null;
          const blocked = isBlocked(arg.date);
          if (!info && !blocked) return arg.dayNumberText;

          return (
            <div className="fc-pan" title={info?.title}>
              <span className="fc-pan-number">{arg.dayNumberText}</span>
              {info && (
                <>
                  <span className="fc-pan-line fc-pan-tithi">{info.tithi}</span>
                  <span className="fc-pan-line fc-pan-nakshatra">{info.nakshatra}</span>
                  {info.day.festivals.map((festival) => (
                    <span key={festival.name} className={`fc-pan-tag ${TAG_CLASS[festival.kind] ?? 'fc-pan-festival'}`}>
                      {festival.name}
                    </span>
                  ))}
                </>
              )}
              {blocked && <span className="fc-blocked-label">{blockedDates[keyOf(arg.date)] || blockedLabel}</span>}
            </div>
          );
        }}
      />
    </div>
  );
}
