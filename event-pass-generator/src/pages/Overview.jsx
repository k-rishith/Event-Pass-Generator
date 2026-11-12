import { useState, useMemo } from 'react';
import { computeEventStats, getEffectiveStatus } from '../utils/passValidation';
import { getAvailableSeats } from '../utils/eventStatus';

/**
 * Overview
 * Dashboard overview showing pass statistics for each owned event.
 *
 * Props:
 *   events          - organizer's events
 *   passes          - all passes
 *   registrations   - all registrations (for available seats)
 *
 * Concepts used: useState, useMemo, map(), filter(), props, utility functions.
 */
export default function Overview({ events, passes, registrations }) {
  const [now] = useState(Date.now());

  const tierTotals = useMemo(() => {
    const totals = {};
    registrations.forEach((r) => {
      totals[r.ticketType] = (totals[r.ticketType] || 0) + 1;
    });
    return totals;
  }, [registrations]);

  const tierNames = useMemo(
    () => Object.keys(tierTotals),
    [tierTotals]
  );
  const maxTier = useMemo(
    () => Math.max(0, ...Object.values(tierTotals)),
    [tierTotals]
  );

  if (events.length === 0) {
    return (
      <div>
        <h2 className="section-title">Overview</h2>
        <p className="subtitle">
          No events yet. Create one in the Create Event section.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="section-title">Overview</h2>
      <p className="subtitle">
        Pass statistics for your events. Statuses are computed live against
        each event's end time.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginTop: 16 }}>
        {events.map((event) => {
          const stats = computeEventStats(event, passes, now);
          const availableSeats = getAvailableSeats(event, registrations);
          return (
            <div key={event.eventId} className="stat-card">
              <div className="stat-event">{event.name}</div>
              <div className="stat-meta">
                {event.eventDate} {event.startTime} - {event.endTime}
                <span>&bull;</span>
                {event.venue}
              </div>
              <div className="stat-grid">
                <div className="stat-item">
                  <div className="stat-value">{stats.total}</div>
                  <div className="stat-label">Registrations</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.active}</div>
                  <div className="stat-label">Active Passes</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.used}</div>
                  <div className="stat-label">Used Passes</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.expired}</div>
                  <div className="stat-label">Expired</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{stats.cancelled}</div>
                  <div className="stat-label">Cancelled</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{availableSeats}</div>
                  <div className="stat-label">Available Seats</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {tierNames.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h3 className="section-title">Registrations by Ticket Type</h3>
          <p className="subtitle">
            Simple breakdown of all registrations across your events.
          </p>
          <div className="tier-chart">
            {tierNames.map((name) => {
              const value = tierTotals[name] || 0;
              const percent = maxTier > 0 ? (value / maxTier) * 100 : 0;
              return (
                <div key={name} className="tier-chart-row">
                  <span className="tier-chart-name">{name}</span>
                  <div className="tier-chart-bar">
                    <div
                      className="tier-chart-fill"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <span className="tier-chart-value">{value}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
