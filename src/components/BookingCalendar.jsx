import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';

const pad = (value) => String(value).padStart(2, '0');
const keyOf = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

// `blockedDates` maps 'YYYY-MM-DD' -> reason for the days on which no bookings are accepted.
export default function BookingCalendar({ events, onEventClick, onDateClick, blockedDates = {}, blockedLabel = 'Blocked' }) {
  const isBlocked = (date) => blockedDates[keyOf(date)] !== undefined;

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
        eventClick={onEventClick ? (info) => { info.jsEvent.preventDefault(); onEventClick(info.event.id); } : undefined}
        eventCursor={onEventClick ? 'pointer' : undefined}
        dateClick={onDateClick ? (info) => onDateClick(info.dateStr) : undefined}
        dayCellClassNames={(arg) => (isBlocked(arg.date) ? ['fc-blocked-day'] : [])}
        dayCellContent={(arg) =>
          isBlocked(arg.date) ? (
            <>
              <span>{arg.dayNumberText}</span>
              <span className="fc-blocked-label">{blockedDates[keyOf(arg.date)] || blockedLabel}</span>
            </>
          ) : (
            arg.dayNumberText
          )
        }
      />
    </div>
  );
}
