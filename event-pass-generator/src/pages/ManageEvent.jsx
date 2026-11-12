import { useState } from 'react';
import { getEffectiveStatus, badgeClass, computeEventStats } from '../utils/passValidation';
import { getAvailableSeats } from '../utils/eventStatus';
import { downloadPassAsPdf } from '../utils/downloadPass';
import EventPass from '../components/EventPass';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'USED', label: 'Used' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const TIER_OPTIONS_LABELS = ['Student', 'Regular', 'VIP', 'Premium'];

/**
 * ManageEvent
 * Per-event management page. Everyone on this device can manage any event
 * — cancel passes, cancel events, and edit event details.
 *
 * Props:
 *   eventId               - the event being managed
 *   events                - all events
 *   passes                - all passes
 *   registrations         - all registrations
 *   onSaveEvents          - callback to persist events
 *   onSavePasses          - callback to persist passes
 *   onSaveRegistrations   - callback to persist registrations
 *   addToast              - callback to show toast notifications
 *
 * Concepts used: useState, props, map(), filter(), conditional rendering.
 */
export default function ManageEvent({
  eventId,
  events,
  passes,
  registrations,
  onSaveEvents,
  onSavePasses,
  onSaveRegistrations,
  addToast,
  onBack,
}) {
  const event = events.find((e) => e.eventId === eventId) || null;

  if (!event) {
    return (
      <div>
        <h2 className="section-title">Event Not Found</h2>
        <p className="subtitle">
          <button type="button" className="btn btn-outline" onClick={() => { if (onBack) onBack(); }}>
            Back to Dashboard
          </button>
        </p>
      </div>
    );
  }

  const eventRegs = registrations.filter((r) => r.eventId === eventId);
  const eventPasses = passes.filter((p) => p.eventId === eventId);
  const stats = computeEventStats(event, passes);
  const availableSeats = getAvailableSeats(event, registrations);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [viewPass, setViewPass] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState(null);

  const filtered = eventRegs
    .filter((reg) => {
      const term = search.toLowerCase();
      const matchText =
        reg.attendeeName.toLowerCase().includes(term) ||
        reg.email.toLowerCase().includes(term) ||
        reg.ticketType.toLowerCase().includes(term) ||
        reg.passId.toLowerCase().includes(term);
      if (!matchText) return false;
      if (statusFilter !== 'ALL') {
        const pass = eventPasses.find((p) => p.passId === reg.passId);
        const effective = pass
          ? getEffectiveStatus(pass, pass.eventEndDateTime)
          : reg.status;
        if (effective !== statusFilter) return false;
      }
      if (tierFilter !== 'ALL' && reg.ticketType !== tierFilter) return false;
      return true;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  const tierNames = [...new Set(eventRegs.map((r) => r.ticketType))];

  function effectiveStatus(pass) {
    return getEffectiveStatus(pass, pass.eventEndDateTime);
  }

  function handleCancelPass(passId) {
    if (!window.confirm('Cancel this pass? This cannot be undone.')) {
      return;
    }
    const nextPasses = passes.map((p) =>
      p.passId === passId ? { ...p, status: 'CANCELLED' } : p
    );
    const nextRegs = registrations.map((r) =>
      r.passId === passId ? { ...r, status: 'CANCELLED' } : r
    );
    onSavePasses(nextPasses);
    onSaveRegistrations(nextRegs);
    if (viewPass && viewPass.passId === passId) {
      setViewPass(nextPasses.find((p) => p.passId === passId) || null);
    }
  }

  function handleEditEvent() {
    setEditFormData({
      name: event.name,
      description: event.description || '',
      eventDate: event.eventDate,
      startTime: event.startTime,
      endTime: event.endTime,
      venue: event.venue || '',
      capacity: String(event.capacity || ''),
      ticketTiers: (event.ticketTiers || []).map((t) => ({
        id: t.id,
        name: t.name,
        price: String(t.price || 0),
        quantity: String(t.quantity || 0),
      })),
    });
    setEditMode(true);
  }

  function handleCancelEvent() {
    if (
      !window.confirm(
        'Cancel this event? All registrations will remain but no new ones can be created. This cannot be undone.'
      )
    ) {
      return;
    }
    const nextEvents = events.map((e) =>
      e.eventId === eventId ? { ...e, statusOverride: 'CANCELLED' } : e
    );
    onSaveEvents(nextEvents);
    addToast({ type: 'success', message: 'Event cancelled.' });
  }

  function handleSaveEdit(event) {
    event.preventDefault();
    const nextEvents = events.map((e) => {
      if (e.eventId !== eventId) return e;
      return {
        ...e,
        name: editFormData.name.trim(),
        description: editFormData.description.trim(),
        eventDate: editFormData.eventDate,
        startTime: editFormData.startTime,
        endTime: editFormData.endTime,
        venue: editFormData.venue.trim(),
        capacity: Number(editFormData.capacity) || 0,
        ticketTiers: editFormData.ticketTiers.filter((t) => t.name.trim()),
        ticketTypes: editFormData.ticketTiers
          .filter((t) => t.name.trim())
          .map((t) => t.name),
      };
    });
    onSaveEvents(nextEvents);
    setEditMode(false);
    setEditFormData(null);
    addToast({ type: 'success', message: 'Event updated.' });
  }

  function copyPassId(passId) {
    if (!passId) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(passId).then(() => {
        addToast({ type: 'success', message: `Pass ID ${passId} copied.` });
      });
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <>
          <h2 className="section-title">Manage Event</h2>
          <p className="subtitle">{event.name}</p>
        </>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => {
            if (onBack) {
              onBack();
            } else {
              setViewPass(null);
            }
          }}
        >
          ← Back to Dashboard
        </button>
        <>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleEditEvent}
          >
            {editMode ? 'Cancel Edit' : 'Edit Event'}
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleCancelEvent}
          >
            Cancel Event
          </button>
        </>
      </div>

      {editMode && editFormData && (
        <div
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            padding: '20px',
            marginBottom: 20,
          }}
        >
          <h3 className="section-title" style={{ marginBottom: 12 }}>
            Edit Event
          </h3>
          <form className="event-form" onSubmit={handleSaveEdit} noValidate>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="editEventName">Event Name</label>
                <input
                  id="editEventName"
                  type="text"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="editEventDescription">Description</label>
                <input
                  id="editEventDescription"
                  type="text"
                  value={editFormData.description}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="editEventDate">Event Date</label>
                <input
                  id="editEventDate"
                  type="date"
                  value={editFormData.eventDate}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, eventDate: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="editStartTime">Start Time</label>
                <input
                  id="editStartTime"
                  type="time"
                  value={editFormData.startTime}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, startTime: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="editEndTime">End Time</label>
                <input
                  id="editEndTime"
                  type="time"
                  value={editFormData.endTime}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, endTime: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="editEventVenue">Venue</label>
                <input
                  id="editEventVenue"
                  type="text"
                  value={editFormData.venue}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, venue: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="editCapacity">Maximum Attendees</label>
                <input
                  id="editCapacity"
                  type="number"
                  min="1"
                  value={editFormData.capacity}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, capacity: e.target.value })
                  }
                />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Ticket Tiers</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  {editFormData.ticketTiers.map((tier) => (
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
                        onClick={() => {
                          setEditFormData({
                            ...editFormData,
                            ticketTiers: editFormData.ticketTiers.filter(
                              (t) => t.id !== tier.id
                            ),
                          });
                        }}
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
                    id="editTierName"
                    type="text"
                    placeholder="Tier name"
                    style={{
                      flex: 1,
                      minWidth: 140,
                      padding: '10px 12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  />
                  <input
                    id="editTierPrice"
                    type="number"
                    min="0"
                    placeholder="Price"
                    style={{
                      width: 90,
                      padding: '10px 12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  />
                  <input
                    id="editTierQty"
                    type="number"
                    min="1"
                    placeholder="Qty"
                    style={{
                      width: 70,
                      padding: '10px 12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      const nameEl = document.getElementById('editTierName');
                      const priceEl = document.getElementById('editTierPrice');
                      const qtyEl = document.getElementById('editTierQty');
                      const name = nameEl?.value.trim();
                      if (!name) return;
                      setEditFormData({
                        ...editFormData,
                        ticketTiers: [
                          ...editFormData.ticketTiers,
                          {
                            id: `tier-${Date.now()}`,
                            name,
                            price: Number(priceEl?.value) || 0,
                            quantity: Number(qtyEl?.value) || 0,
                          },
                        ],
                      });
                      nameEl.value = '';
                      priceEl.value = '';
                      qtyEl.value = '';
                    }}
                  >
                    Add Tier
                  </button>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                type="submit"
                className="btn btn-primary"
              >
                Save Changes
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setEditMode(false)}
              >
                Discard
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
        <div className="stat-item" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '14px 10px', boxShadow: 'var(--shadow)' }}>
          <div className="stat-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 4 }}>Registrations</div>
          <div className="stat-value" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)' }}>{eventRegs.length}</div>
        </div>
        <div className="stat-item" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '14px 10px', boxShadow: 'var(--shadow)' }}>
          <div className="stat-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 4 }}>Active Passes</div>
          <div className="stat-value" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-success)' }}>{stats.active}</div>
        </div>
        <div className="stat-item" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '14px 10px', boxShadow: 'var(--shadow)' }}>
          <div className="stat-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 4 }}>Used Passes</div>
          <div className="stat-value" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-secondary)' }}>{stats.used}</div>
        </div>
        <div className="stat-item" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '14px 10px', boxShadow: 'var(--shadow)' }}>
          <div className="stat-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 4 }}>Expired</div>
          <div className="stat-value" style={{ fontSize: '20px', fontWeight: 800, color: '#ca8a04' }}>{stats.expired}</div>
        </div>
        <div className="stat-item" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '14px 10px', boxShadow: 'var(--shadow)' }}>
          <div className="stat-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 4 }}>Cancelled</div>
          <div className="stat-value" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-danger)' }}>{stats.cancelled}</div>
        </div>
        <div className="stat-item" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '14px 10px', boxShadow: 'var(--shadow)' }}>
          <div className="stat-label" style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: 4 }}>Available Seats</div>
          <div className="stat-value" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text)' }}>{availableSeats}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search attendee, email, ticket, pass ID..."
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
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 12px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
            fontFamily: 'inherit',
          }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          style={{
            padding: '10px 12px',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
            fontFamily: 'inherit',
          }}
        >
          <option value="ALL">All Ticket Types</option>
          {tierNames.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <h3 className="section-title" style={{ marginBottom: 8 }}>Registered Attendees</h3>
      {filtered.length === 0 ? (
        <p className="empty">
          No registrations match your search and filter.
        </p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
          <thead>
            <tr
              style={{
                textAlign: 'left',
                borderBottom: '2px solid var(--color-border)',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
              }}
            >
              <th style={{ padding: '10px 8px' }}>Attendee</th>
              <th style={{ padding: '10px 8px' }}>Email</th>
              <th style={{ padding: '10px 8px' }}>Ticket Type</th>
              <th style={{ padding: '10px 8px' }}>Pass ID</th>
              <th style={{ padding: '10px 8px' }}>Status</th>
              <th style={{ padding: '10px 8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((reg) => {
              const pass = eventPasses.find((p) => p.passId === reg.passId);
              const effective = pass
                ? getEffectiveStatus(pass, pass.eventEndDateTime)
                : reg.status;
              return (
                <tr
                  key={reg.registrationId}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: '14px',
                  }}
                >
                  <td style={{ padding: '10px 8px' }}>{reg.attendeeName}</td>
                  <td style={{ padding: '10px 8px' }}>{reg.email}</td>
                  <td style={{ padding: '10px 8px' }}>{reg.ticketType}</td>
                  <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{reg.passId}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span className={badgeClass(effective)}>{effective}</span>
                  </td>
                  <td style={{ padding: '10px 8px', display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                      onClick={() => {
                        const p = eventPasses.find((x) => x.passId === reg.passId);
                        if (p) setViewPass(p);
                      }}
                    >
                      View
                    </button>
                    {effective !== 'CANCELLED' && (
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                        onClick={() => handleCancelPass(reg.passId)}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {viewPass && (
        <div style={{ marginTop: 32 }}>
          <section style={{ textAlign: 'center' }}>
            <h2 className="section-title">Pass Details</h2>
            <EventPass
              pass={viewPass}
              onDownload={() => {
                const el = document.getElementById('event-pass');
                if (el) {
                  downloadPassAsPdf(el, `pass-${viewPass.passId}.pdf`);
                }
              }}
              onCopyPassId={() => copyPassId(viewPass.passId)}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
              {effectiveStatus(viewPass) !== 'CANCELLED' && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleCancelPass(viewPass.passId)}
                >
                  Cancel Pass
                </button>
              )}
            </div>
          </section>
          <button
            type="button"
            className="btn btn-outline"
            style={{ marginTop: 16 }}
            onClick={() => setViewPass(null)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
