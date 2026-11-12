import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getEventState, getAvailableSeats } from '../utils/eventStatus';

/**
 * EventDetails
 * Public event details page. Shows event info, ticket tiers, availability,
 * and registration status. No sign-in required to view or register.
 *
 * Props:
 *   events                 - all created events
 *   registrations          - all registrations (for seat counts)
 *   onSaveRegistrations    - callback to persist registrations
 *   onSaveEvents           - callback to persist events
 *
 * Concepts used: useState, useParams, useNavigate, props, conditional
 * rendering, map(), filter().
 */
export default function EventDetails({
  events,
  registrations,
  onSaveRegistrations,
  onSaveEvents,
}) {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const event = events.find((e) => e.eventId === eventId) || null;

  if (!event) {
    return (
      <div>
        <h2 className="section-title">Event Not Found</h2>
        <p className="subtitle">
          The event you're looking for doesn't exist.
        </p>
        <p className="subtitle">
          <Link to="/" className="btn-link">Back to Home</Link>
        </p>
      </div>
    );
  }

  const state = getEventState(event, registrations);
  const availableSeats = getAvailableSeats(event, registrations);
  const tierCounts = {};

  registrations
    .filter((r) => r.eventId === eventId)
    .forEach((r) => {
      tierCounts[r.ticketType] = (tierCounts[r.ticketType] || 0) + 1;
    });

  function handleRegister(tier) {
    if (state === 'SOLD OUT' || state === 'COMPLETED' || state === 'CANCELLED') {
      return;
    }
    const tierUsed = tierCounts[tier.name] || 0;
    if (tierUsed >= tier.quantity) {
      return;
    }
    navigate(`/register/${eventId}?tier=${encodeURIComponent(tier.name)}`);
  }

  return (
    <div>
      <h2 className="section-title">Event Details</h2>

      <div className="event-details">
        {event.banner ? (
          <img
            src={event.banner}
            alt={`${event.name} banner`}
            className="event-banner"
            style={{ maxHeight: 220, objectFit: 'cover' }}
          />
        ) : (
          <div className="event-banner-placeholder">
            <span>🎫</span>
          </div>
        )}

        <div className="event-details-body">
          <div className="event-detail-status">
            <span className={`status-badge status-${state}`}>{state}</span>
          </div>
          <h1 className="event-detail-name">{event.name}</h1>
          <p className="event-detail-description">{event.description || 'No description provided.'}</p>

          <div className="event-detail-meta">
            <div className="meta-item">
              <span className="meta-label">Date</span>
              <span className="meta-value">{event.eventDate}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Time</span>
              <span className="meta-value">{event.startTime} - {event.endTime}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Venue</span>
              <span className="meta-value">{event.venue}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Available Seats</span>
              <span className="meta-value">{availableSeats}</span>
            </div>
          </div>

          <div className="event-detail-tickets">
            <h3 className="ticket-section-title">Available Tickets</h3>
            <div className="ticket-list">
              {event.ticketTiers.map((tier) => {
                const used = tierCounts[tier.name] || 0;
                const left = tier.quantity - used;
                const soldOut = left <= 0;
                return (
                  <div key={tier.id} className="ticket-card">
                    <div className="ticket-info">
                      <div className="ticket-name">{tier.name}</div>
                      <div className="ticket-seats">
                        {left} available{' '}
                        {soldOut ? '(sold out)' : ''}
                      </div>
                    </div>
                    <div className="ticket-price">
                      {tier.price > 0 ? `₹${tier.price}` : 'Free'}
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={soldOut || state === 'SOLD OUT' || state === 'COMPLETED' || state === 'CANCELLED'}
                      onClick={() => handleRegister(tier)}
                    >
                      {soldOut ? 'Sold Out' : 'Register'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="event-detail-actions" style={{ marginTop: 16 }}>
            <Link to="/" className="btn btn-outline">
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
