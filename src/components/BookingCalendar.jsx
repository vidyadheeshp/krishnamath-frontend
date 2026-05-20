import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';

export default function BookingCalendar({ events, onEventClick, onDateClick }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white p-4 shadow-card">
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
      />
    </div>
  );
}
