import { useState } from 'react';
import { getEffectiveStatus, badgeClass } from '../utils/passValidation';
import EventPass from '../components/EventPass';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'USED', label: 'Used' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

/**
 * ManagePasses
 * Table of all passes with search, status filter, view, and cancel actions.
 * Everyone on this device can manage all passes.
 *
 * Props:
 *   events          - all events (for event name lookup)
 *   passes          - all passes
 *   registrations   - all registrations (for attendee lookup)
 *   onSavePasses    - callback to persist updated passes
 *   now             - current timestamp for effective-status computation
 *
 * Concepts used: useState, map(), filter(), props, conditional rendering.
 */
export default function ManagePasses({
  events,
  passes,
  registrations,
  onSavePasses,
  now,
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewPass, setViewPass] = useState(null);

  const eventMap = new Map(events.map((e) => [e.eventId, e.name]));
  const regMap = new Map();
  registrations.forEach((r) => {
    regMap.set(r.passId, r);
  });

  const eventPasses = passes;

  const filtered = eventPasses
    .filter((pass) => {
      const term = search.toLowerCase();
      const matchText =
        pass.passId.toLowerCase().includes(term) ||
        pass.attendeeName.toLowerCase().includes(term) ||
        pass.email.toLowerCase().includes(term) ||
        (pass.eventName || '').toLowerCase().includes(term);
      if (!matchText) return false;
      const eventName = eventMap.get(pass.eventId) || pass.eventName || '';
      if (!eventName.toLowerCase().includes(term)) return false;
      const effective = getEffectiveStatus(pass, pass.eventEndDateTime, now);
      if (statusFilter !== 'ALL' && effective !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  function handleCancel(passId) {
    if (!window.confirm('Cancel this pass? This cannot be undone.')) {
      return;
    }
    const next = passes.map((pass) =>
      pass.passId === passId ? { ...pass, status: 'CANCELLED' } : pass
    );
    onSavePasses(next);
    if (viewPass && viewPass.passId === passId) {
      setViewPass(next.find((p) => p.passId === passId) || null);
    }
  }

  return (
    <div>
      <h2 className="section-title">Manage Passes</h2>
      <p className="subtitle">
        Search and filter passes for your events. Cancel a pass to mark it as{' '}
        <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
          CANCELLED
        </span>.
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search by Pass ID, attendee, email, or event..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
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
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="empty">
          No passes match your search and filter.
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
              <th style={{ padding: '10px 8px' }}>Pass ID</th>
              <th style={{ padding: '10px 8px' }}>Attendee</th>
              <th style={{ padding: '10px 8px' }}>Event</th>
              <th style={{ padding: '10px 8px' }}>Ticket</th>
              <th style={{ padding: '10px 8px' }}>Status</th>
              <th style={{ padding: '10px 8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((pass) => {
              const effective = getEffectiveStatus(
                pass,
                pass.eventEndDateTime,
                now
              );
              const eventName =
                eventMap.get(pass.eventId) || pass.eventName || '—';
              const reg = regMap.get(pass.passId);
              return (
                <tr
                  key={pass.passId}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: '14px',
                  }}
                >
                  <td style={{ padding: '10px 8px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {pass.passId}
                  </td>
                  <td style={{ padding: '10px 8px' }}>{pass.attendeeName}</td>
                  <td style={{ padding: '10px 8px' }}>{eventName}</td>
                  <td style={{ padding: '10px 8px' }}>{pass.ticketType}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span className={badgeClass(effective)}>{effective}</span>
                  </td>
                  <td style={{ padding: '10px 8px', display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                      onClick={() => setViewPass(pass)}
                    >
                      View
                    </button>
                    {effective !== 'CANCELLED' && (
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                        onClick={() => handleCancel(pass.passId)}
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
          <EventPass pass={viewPass} onDownload={() => {}} />
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
