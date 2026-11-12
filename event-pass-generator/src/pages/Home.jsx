import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EventCard from '../components/EventCard';
import { getEventState, stateLabel } from '../utils/eventStatus';

/**
 * Home
 * Public event listing. Users can browse all events without signing in.
 * Registration and organizing are open to everyone on this device.
 *
 * Props:
 *   events                   - all created events
 *   passes                   - all passes
 *   registrations            - all registrations (for seat counts)
 *   onSavePasses             - callback to persist passes
 *   onSaveRegistrations      - callback to persist registrations
 *
 * Concepts used: useState, useMemo, map(), filter(), props, conditional
 * rendering, routing links.
 */
export default function Home({
  events,
  passes,
  registrations,
  onSavePasses,
  onSaveRegistrations,
}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  const FILTERS = [
    { key: 'ALL', label: 'All' },
    { key: 'UPCOMING', label: 'Upcoming' },
    { key: 'TODAY', label: 'Today' },
    { key: 'THIS_WEEK', label: 'This Week' },
    { key: 'FREE', label: 'Free' },
    { key: 'PAID', label: 'Paid' },
  ];

  const now = Date.now();

  const filtered = useMemo(() => {
    return events
      .filter((event) => {
        const term = search.toLowerCase();
        if (term && !event.name.toLowerCase().includes(term)) {
          return false;
        }
        const state = getEventState(event, registrations, now);
        if (filter === 'FREE') {
          return event.ticketTiers.some((t) => Number(t.price) === 0);
        }
        if (filter === 'PAID') {
          return event.ticketTiers.some((t) => Number(t.price) > 0);
        }
        if (filter === 'TODAY') {
          return event.eventDate === new Date(now).toISOString().split('T')[0];
        }
        if (filter === 'THIS_WEEK') {
          const eventDay = new Date(`${event.eventDate}T00:00:00`).getTime();
          const weekStart = new Date(
            now - ((now + new Date(now).getTimezoneOffset() * 60000) % 86400000)
          ).setHours(0, 0, 0, 0);
          const weekEnd = weekStart + 6 * 86400000;
          return eventDay >= weekStart && eventDay <= weekEnd;
        }
        if (filter === 'UPCOMING') {
          return state === 'UPCOMING' || state === 'OPEN';
        }
        return true;
      })
      .sort((a, b) => {
        const aTime = new Date(`${a.eventDate}T${a.startTime}`).getTime();
        const bTime = new Date(`${b.eventDate}T${b.startTime}`).getTime();
        return aTime - bTime;
      });
  }, [events, registrations, search, filter, now]);

  function handleRegister(event, tier) {
    navigate(`/events/${event.eventId}`);
  }

  return (
    <div>
      <section className="home-hero">
        <div className="home-hero-content">
          <h1 className="section-title">Discover Events</h1>
          <p className="subtitle">
            Browse upcoming events, register, and download your digital pass.
          </p>
        </div>
        <div className="home-actions">
          <Link to="/organizer" className="btn btn-primary">
            Organize Event
          </Link>
        </div>
      </section>

      <div className="home-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search events by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: 220,
              padding: '10px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          />
        </div>
        <div className="filter-chip-group">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={`filter-chip ${filter === f.key ? 'filter-chip-active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="empty">
          No events match your search and filter.
        </p>
      ) : (
        <div className="event-grid">
          {filtered.map((event) => (
            <EventCard
              key={event.eventId}
              event={event}
              registrations={registrations}
              onRegister={handleRegister}
            />
          ))}
        </div>
      )}
    </div>
  );
}
