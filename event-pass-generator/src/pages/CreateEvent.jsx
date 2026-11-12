import { useState, useRef } from 'react';
import { generateEventId } from '../utils/storage';

const DEFAULT_TIERS = [
  { id: 'tier-student', name: 'Student', price: 199, quantity: 50 },
  { id: 'tier-regular', name: 'Regular', price: 399, quantity: 150 },
  { id: 'tier-vip', name: 'VIP', price: 999, quantity: 50 },
];

const initialEvent = {
  name: '',
  description: '',
  banner: '',
  eventDate: '',
  startTime: '09:00',
  endTime: '17:00',
  venue: '',
  capacity: '',
  ticketTiers: [...DEFAULT_TIERS],
};

/**
 * CreateEvent
 * Form for creating a new event with ticket tiers. No sign-in is required —
 * anyone on this device can create an event and manage it from the Organizer
 * Dashboard.
 *
 * Props:
 *   events        - existing events (for unique ID generation)
 *   onSaveEvents  - callback to persist updated events
 *   onCreated     - optional callback after successful creation
 *
 * Concepts used: useState, controlled inputs, event handlers, form
 * submission, array methods, file-to-dataURL for banner.
 */
export default function CreateEvent({ events, onSaveEvents, onCreated }) {
  const [formData, setFormData] = useState(initialEvent);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const ticketInputRef = useRef(null);
  const priceInputRef = useRef(null);
  const qtyInputRef = useRef(null);

  function handleChange(fieldName, value) {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  }

  function addTier() {
    const name = ticketInputRef.current?.value.trim();
    const price = Number(priceInputRef.current?.value) || 0;
    const qty = Number(qtyInputRef.current?.value) || 0;
    if (!name) return;
    if (formData.ticketTiers.some((t) => t.name === name)) return;
    setFormData((prev) => ({
      ...prev,
      ticketTiers: [
        ...prev.ticketTiers,
        { id: `tier-${name.toLowerCase().replace(/\s+/g, '-')}`, name, price, quantity: qty },
      ],
    }));
    ticketInputRef.current.value = '';
    priceInputRef.current.value = '';
    qtyInputRef.current.value = '';
  }

  function removeTier(id) {
    setFormData((prev) => ({
      ...prev,
      ticketTiers: prev.ticketTiers.filter((t) => t.id !== id),
    }));
  }

  function updateTier(id, field, value) {
    setFormData((prev) => ({
      ...prev,
      ticketTiers: prev.ticketTiers.map((t) =>
        t.id === id ? { ...t, [field]: value } : t
      ),
    }));
  }

  function validate() {
    const next = {};
    if (!formData.name || !formData.name.trim()) {
      next.name = 'Event name is required.';
    }
    if (!formData.eventDate) {
      next.eventDate = 'Event date is required.';
    }
    if (!formData.startTime) {
      next.startTime = 'Start time is required.';
    }
    if (!formData.endTime) {
      next.endTime = 'End time is required.';
    }
    if (!formData.venue || !formData.venue.trim()) {
      next.venue = 'Venue is required.';
    }
    if (!formData.capacity || Number(formData.capacity) <= 0) {
      next.capacity = 'Maximum attendees must be greater than 0.';
    }
    if (formData.startTime && formData.endTime && formData.endTime <= formData.startTime) {
      next.endTime = 'End time must be after start time.';
    }
    if (formData.ticketTiers.length === 0) {
      next.ticketTiers = 'Add at least one ticket tier.';
    } else {
      for (const tier of formData.ticketTiers) {
        if (!tier.name || !tier.name.trim()) {
          next.ticketTiers = 'Every tier needs a name.';
          break;
        }
        if (Number(tier.quantity) <= 0) {
          next.ticketTiers = 'Every tier needs a quantity greater than 0.';
          break;
        }
      }
    }
    setErrors(next);
    return Object.values(next).some(Boolean);
  }

  function handleBannerChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrors({ banner: 'Banner image must be under 2 MB.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData((prev) => ({ ...prev, banner: e.target.result }));
      setErrors({});
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const invalid = validate();
    if (invalid) {
      return;
    }

    const newEvent = {
      eventId: generateEventId(events.map((e) => e.eventId)),
      ownerId: null,
      name: formData.name.trim(),
      description: formData.description.trim(),
      banner: formData.banner || null,
      eventDate: formData.eventDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      venue: formData.venue.trim(),
      capacity: Number(formData.capacity),
      ticketTiers: [...formData.ticketTiers],
      ticketTypes: formData.ticketTiers.map((t) => t.name),
      statusOverride: null,
      roles: {},
      createdAt: Date.now(),
    };

    const nextEvents = [...events, newEvent];
    onSaveEvents(nextEvents);
    setMessage('Event created successfully. You are the owner of this event.');
    setTimeout(() => setMessage(null), 3000);
    if (onCreated) {
      onCreated(newEvent);
    }
  }

  return (
    <div>
      <h2 className="section-title">Create Event</h2>
      <p className="subtitle">
        Create a new event. You can manage it from the Organizer Dashboard.
      </p>
      {message && <p className="subtitle" style={{ color: 'var(--color-success)' }}>{message}</p>}
      <form className="event-form" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="eventName">Event Name</label>
            <input
              id="eventName"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="eventDescription">Description</label>
            <input
              id="eventDescription"
              type="text"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="eventBanner">Event Banner (image)</label>
            <input
              id="eventBanner"
              type="file"
              accept="image/*"
              onChange={handleBannerChange}
            />
            {errors.banner && <span className="error-message">{errors.banner}</span>}
            {formData.banner && (
              <img
                src={formData.banner}
                alt="Preview"
                className="event-banner"
                style={{ width: 160, height: 90, marginTop: 8, objectFit: 'cover' }}
              />
            )}
          </div>
          <div className="form-group">
            <label htmlFor="eventDate">Event Date</label>
            <input
              id="eventDate"
              type="date"
              value={formData.eventDate}
              onChange={(e) => handleChange('eventDate', e.target.value)}
            />
            {errors.eventDate && <span className="error-message">{errors.eventDate}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="startTime">Start Time</label>
            <input
              id="startTime"
              type="time"
              value={formData.startTime}
              onChange={(e) => handleChange('startTime', e.target.value)}
            />
            {errors.startTime && <span className="error-message">{errors.startTime}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="endTime">End Time</label>
            <input
              id="endTime"
              type="time"
              value={formData.endTime}
              onChange={(e) => handleChange('endTime', e.target.value)}
            />
            {errors.endTime && <span className="error-message">{errors.endTime}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="eventVenue">Venue</label>
            <input
              id="eventVenue"
              type="text"
              value={formData.venue}
              onChange={(e) => handleChange('venue', e.target.value)}
            />
            {errors.venue && <span className="error-message">{errors.venue}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="capacity">Maximum Attendees (total capacity)</label>
            <input
              id="capacity"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => handleChange('capacity', e.target.value)}
            />
            {errors.capacity && <span className="error-message">{errors.capacity}</span>}
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Ticket Tiers</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              {formData.ticketTiers.map((tier) => (
                <span
                  key={tier.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px',
                  }}
                >
                  {tier.name} — ₹{tier.price} × {tier.quantity}
                  <button
                    type="button"
                    onClick={() => removeTier(tier.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-danger)',
                      cursor: 'pointer',
                      fontSize: '18px',
                      lineHeight: 1,
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'end', marginBottom: 8 }}>
              <input
                id="newTicketType"
                ref={ticketInputRef}
                type="text"
                placeholder="Tier name (e.g. Premium)"
                style={{ flex: 1, minWidth: 140, padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTier();
                  }
                }}
              />
              <input
                ref={priceInputRef}
                type="number"
                min="0"
                placeholder="Price"
                style={{ width: 90, padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTier();
                  }
                }}
              />
              <input
                ref={qtyInputRef}
                type="number"
                min="1"
                placeholder="Qty"
                style={{ width: 70, padding: '10px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTier();
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-outline"
                onClick={addTier}
              >
                Add Tier
              </button>
            </div>
            {errors.ticketTiers && <span className="error-message">{errors.ticketTiers}</span>}
          </div>
        </div>
        <button type="submit" className="btn btn-primary" style={{ gridColumn: '1 / -1' }}>
          Create Event
        </button>
      </form>
    </div>
  );
}
