import { Link } from 'react-router-dom';
import { getEventState } from '../utils/eventStatus';

/**
 * MyEvents
 * Lists all events created on this device.
 *
 * Props:
 *   events          - all events
 *   passes          - all passes (for counts)
 *   onManageEvent   - called to open the manage view for an event
 *
 * Concepts used: map(), filter(), props, conditional rendering.
 */
export default function MyEvents({ events, passes, onManageEvent }) {
  if (events.length === 0) {
    return (
      <div>
        <h2 className="section-title">My Events</h2>
        <p className="subtitle">
          You haven't created any events yet. Create one to get started.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="section-title">My Events</h2>
      <p className="subtitle">
        All events created on this device.
      </p>
      <div className="pass-list">
        {events.map((event) => {
          const eventPasses = passes.filter((p) => p.eventId === event.eventId);
          const state = getEventState(event, []);
          return (
            <article key={event.eventId} className="pass-card">
              <div className="card-info">
                <div className="card-event">{event.name}</div>
                <div className="card-attendee">
                  {event.eventDate} {event.startTime} - {event.endTime}
                </div>
                <div className="card-meta">
                  <span>{event.venue}</span>
                  <span>&bull;</span>
                  <span>Capacity: {event.capacity}</span>
                  <span>&bull;</span>
                  <span>{event.ticketTypes.join(', ')}</span>
                </div>
                <div className="card-meta" style={{ marginTop: 4 }}>
                  Passes: {eventPasses.length}
                  <span>&bull;</span>
                  <span style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 700 }}>{state}</span>
                </div>
              </div>
              <div className="card-actions" style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => onManageEvent(event.eventId)}
                >
                  Manage Event
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
