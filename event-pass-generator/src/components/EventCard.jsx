import { Link } from 'react-router-dom';
import { getEventState, getAvailableSeats, getTierAvailable, stateLabel } from '../utils/eventStatus';

/**
 * EventCard
 * A single event card for the public home listing.
 *
 * Props:
 *   event         - the event object
 *   registrations - all registrations (for seat counts)
 *   onRegister    - called when the user registers for a tier: (tier) => {}
 *
 * Concepts used: props, conditional rendering, map(), utility functions.
 */
export default function EventCard({ event, registrations, onRegister }) {
  const state = getEventState(event, registrations);
  const availableSeats = getAvailableSeats(event, registrations);
  const startingPrice = Math.min(...event.ticketTiers.map((t) => Number(t.price) || 0));
  const free = startingPrice === 0;

  function handleRegister(tier) {
    const left = getTierAvailable(event, tier.name, registrations);
    if (left <= 0) return;
    onRegister(event, tier);
  }

  return (
    <article className="event-card">
      {event.banner ? (
        <img src={event.banner} alt={`${event.name} banner`} className="event-card-banner" />
      ) : (
        <div className="event-card-banner-placeholder">
          <span>🎫</span>
        </div>
      )}
      <div className="event-card-body">
        <div className="event-card-header">
          <span className={`status-badge status-badge-${state.replace(' ', '')}`}>
            {stateLabel(state)}
          </span>
        </div>
        <Link to={`/events/${event.eventId}`} className="event-card-link">
          <h3 className="event-card-name">{event.name}</h3>
        </Link>
        <p className="event-card-description">{event.description || 'No description provided.'}</p>
        <div className="event-card-meta">
          <span className="meta-item">
            <span className="meta-icon">📅</span>
            {event.eventDate}
          </span>
          <span className="meta-item">
            <span className="meta-icon">🕐</span>
            {event.startTime} - {event.endTime}
          </span>
          <span className="meta-item">
            <span className="meta-icon">📍</span>
            {event.venue}
          </span>
        </div>
        <div className="event-card-tiers">
          {event.ticketTiers.map((tier) => {
            const left = getTierAvailable(event, tier.name, registrations);
            return (
              <span
                key={tier.id}
                className="tier-chip"
                style={{ opacity: left <= 0 ? 0.6 : 1 }}
              >
                {tier.name} {free ? '' : `— ₹${tier.price}`}{left <= 0 ? ' (sold out)' : ''}
              </span>
            );
          })}
        </div>
        <div className="event-card-seats">
          {availableSeats} seats available
        </div>
        <div className="event-card-actions">
          <Link to={`/events/${event.eventId}`} className="btn btn-outline" style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}>
            View Event
          </Link>
          <button
            type="button"
            className="btn btn-primary"
            disabled={
              state === 'SOLD OUT' ||
              state === 'COMPLETED' ||
              state === 'CANCELLED'
            }
            onClick={() => {
              const firstAvailable = event.ticketTiers.find(
                (t) => getTierAvailable(event, t.name, registrations) > 0
              );
              if (firstAvailable) {
                onRegister(event, firstAvailable);
              }
            }}
            style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
          >
            {state === 'SOLD OUT' ? 'Sold Out' : 'Register'}
          </button>
        </div>
      </div>
    </article>
  );
}
