import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { generatePassId } from '../utils/generatePassId';
import { getEventState, getAvailableSeats } from '../utils/eventStatus';
import { downloadPassAsPdf } from '../utils/downloadPass';
import EventPass from '../components/EventPass';

/**
 * RegisterEvent
 * Registration flow. Anyone can register for an event tier, which creates a
 * registration record and an ACTIVE pass linked to the event. No sign-in is
 * required — attendees enter their name and email directly.
 *
 * Props:
 *   events                - all created events
 *   registrations         - all registrations
 *   passes                - all passes
 *   users                 - all users (legacy compat, unused)
 *   onSaveRegistrations   - callback to persist registrations
 *   onSavePasses          - callback to persist passes
 *   onSaveEvents          - callback to persist events (seat bookkeeping)
 *
 * Concepts used: useState, useParams, useNavigate, props, form submission,
 * conditional rendering, map(), filter().
 */
export default function RegisterEvent({
  events,
  registrations,
  passes,
  users,
  onSaveRegistrations,
  onSavePasses,
  onSaveEvents,
}) {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [tierFromUrl, setTierFromUrl] = useState(null);
  const [selectedTier, setSelectedTier] = useState(null);
  const [attendeeName, setAttendeeName] = useState('');
  const [email, setEmail] = useState('');
  const [searchParams] = useSearchParams();
  [users];
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [createdPass, setCreatedPass] = useState(null);

  const event = events.find((e) => e.eventId === eventId) || null;

  if (!event) {
    return (
      <div>
        <h2 className="section-title">Event Not Found</h2>
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

  if (tierFromUrl === null && event.ticketTiers.length > 0) {
    setTierFromUrl(event.ticketTiers[0].name);
  }

  function validate() {
    const next = {};
    if (!selectedTier) {
      next.tier = 'Please select a ticket tier.';
    }
    if (!attendeeName || !attendeeName.trim()) {
      next.name = 'Attendee name is required.';
    }
    if (!email || !email.trim()) {
      next.email = 'Email is required.';
    }
    setError(null);
    setMessage(null);
    return Object.values(next).some(Boolean);
  }

  function handleConfirm() {
    if (validate()) {
      return;
    }
    // Prevent duplicate registration for same email + event
    const normalizedEmail = email.trim().toLowerCase();
    const alreadyRegistered = registrations.some(
      (r) => r.eventId === eventId && r.email === normalizedEmail
    );
    if (alreadyRegistered) {
      setError('This email is already registered for this event.');
      return;
    }
    if (state === 'SOLD OUT' || state === 'EVENT ENDED' || state === 'CANCELLED') {
      setError('Registration is not available for this event.');
      return;
    }
    const tierUsed = tierCounts[selectedTier.name] || 0;
    if (tierUsed >= selectedTier.quantity) {
      setError('This ticket tier is sold out.');
      return;
    }
    if (availableSeats <= 0) {
      setError('This event is sold out.');
      return;
    }

    setLoading(true);

    const registrationId = `REG-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000)}`;
    const passId = generatePassId(passes.map((p) => p.passId));

    const registration = {
      registrationId,
      eventId,
      userId: null,
      attendeeName: attendeeName.trim(),
      email: normalizedEmail,
      ticketTierId: selectedTier.id,
      ticketType: selectedTier.name,
      ticketPrice: Number(selectedTier.price) || 0,
      passId,
      status: 'REGISTERED',
      createdAt: Date.now(),
    };

    const pass = {
      passId,
      registrationId,
      eventId,
      userId: null,
      attendeeName: attendeeName.trim(),
      email: normalizedEmail,
      eventName: event.name,
      eventDate: event.eventDate,
      startTime: event.startTime,
      endTime: event.endTime,
      venue: event.venue,
      ticketType: selectedTier.name,
      ticketPrice: Number(selectedTier.price) || 0,
      status: 'ACTIVE',
      createdAt: Date.now(),
      eventEndDateTime: `${event.eventDate}T${event.endTime}`,
    };

    const nextRegistrations = [...registrations, registration];
    const nextPasses = [...passes, pass];

    onSaveRegistrations(nextRegistrations);
    onSavePasses(nextPasses);
    setLoading(false);
    setCreatedPass(pass);
    setMessage(
      `Registered for ${event.name}! Your pass has been created.`
    );
  }

  return (
    <div>
      <h2 className="section-title">Register for {event.name}</h2>
      <p className="subtitle">
        Select your ticket and confirm your details.
      </p>

      {state !== 'OPEN' && state !== 'UPCOMING' && (
        <p className="error-message" style={{ marginBottom: 16 }}>
          Registration is currently {state.toLowerCase()} for this event.
        </p>
      )}

      <div className="ticket-list">
        {event.ticketTiers.map((tier) => {
          const used = tierCounts[tier.name] || 0;
          const left = tier.quantity - used;
          const soldOut = left <= 0;
          return (
            <div key={tier.id} className="ticket-card">
              <div className="ticket-info">
                <div
                  className={`ticket-name ${selectedTier?.id === tier.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTier(tier)}
                >
                  {tier.name}
                  {selectedTier?.id === tier.id ? ' ✓' : ''}
                </div>
                <div className="ticket-seats">
                  {left} available {soldOut ? '(sold out)' : ''}
                </div>
              </div>
              <div className="ticket-price">
                {tier.price > 0 ? `₹${tier.price}` : 'Free'}
              </div>
            </div>
          );
        })}
      </div>

      {error && <p className="error-message">{error}</p>}
      {message && <p className="subtitle" style={{ color: 'var(--color-success)', marginBottom: 16 }}>{message}</p>}

      {createdPass && (
        <div style={{ marginTop: 20 }}>
          <EventPass
            pass={createdPass}
            onDownload={() => {
              const el = document.getElementById('event-pass');
              if (el) {
                downloadPassAsPdf(el, `pass-${createdPass.passId}.pdf`);
              }
            }}
            onCopyPassId={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(createdPass.passId);
              }
            }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/user-dashboard')}
            >
              Go to My Passes
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setCreatedPass(null);
                setMessage(null);
                setAttendeeName('');
                setEmail('');
                setSelectedTier(null);
              }}
            >
              Register Another
            </button>
          </div>
        </div>
      )}

      {!message && !createdPass && (
        <form className="event-form" noValidate>
          <div className="form-group">
            <label htmlFor="regAttendeeName">Attendee Name</label>
            <input
              id="regAttendeeName"
              type="text"
              value={attendeeName}
              onChange={(e) => setAttendeeName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="regEmail">Email</label>
            <input
              id="regEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="registration-note">
              Available seats: <strong>{availableSeats}</strong>
            </label>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={loading || state !== 'OPEN' && state !== 'UPCOMING'}
            style={{ width: '100%', marginTop: 8 }}
          >
            {loading ? 'Registering...' : 'Confirm Registration'}
          </button>
        </form>
      )}

      <p className="subtitle" style={{ marginTop: 16, textAlign: 'center' }}>
        <Link to={`/events/${eventId}`} className="btn-link">
          Back to Event
        </Link>
      </p>
    </div>
  );
}
