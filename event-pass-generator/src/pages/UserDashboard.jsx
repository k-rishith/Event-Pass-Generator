import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getEffectiveStatus, badgeClass } from '../utils/passValidation';
import { downloadPassAsPdf } from '../utils/downloadPass';
import EventPass from '../components/EventPass';

/**
 * UserDashboard
 * Public dashboard: All Registrations and All Passes on this device.
 * No sign-in is required — this shows every registration/pass stored
 * locally.
 *
 * Props:
 *   events             - all created events (for event name lookup)
 *   passes             - all passes
 *   registrations      - all registrations
 *   onSavePasses       - callback to persist passes
 *   addToast           - callback to show toast notifications
 *
 * Concepts used: useState, props, conditional rendering, map(), filter().
 */
export default function UserDashboard({
  events,
  passes,
  registrations,
  onSavePasses,
  addToast,
}) {
  const [activeTab, setActiveTab] = useState('registrations');
  const [viewPass, setViewPass] = useState(null);

  function copyPassId(passId) {
    if (!passId) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(passId).then(() => {
        addToast({ type: 'success', message: `Pass ID ${passId} copied.` });
      });
    }
  }

  const allRegistrations = registrations;
  const allPasses = passes;

  const eventMap = new Map(events.map((e) => [e.eventId, e.name]));

  const tabs = [
    { key: 'registrations', label: 'Registrations' },
    { key: 'passes', label: 'Passes' },
  ];

  return (
    <div>
      <h2 className="section-title">My Dashboard</h2>
      <p className="subtitle">
        Manage your registrations and digital passes stored on this device.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`btn ${activeTab === tab.key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'registrations' && (
        <section>
          <h3 className="section-title">Registrations</h3>
          {allRegistrations.length === 0 ? (
            <p className="empty">
              You haven't registered for any events yet.
            </p>
          ) : (
            <div className="pass-list">
              {[...allRegistrations].reverse().map((reg) => {
                const event = eventMap.get(reg.eventId) || { name: 'Unknown Event' };
                const pass = allPasses.find((p) => p.passId === reg.passId) || null;
                const effectiveStatus = pass
                  ? getEffectiveStatus(pass, pass.eventEndDateTime)
                  : '—';
                return (
                  <article key={reg.registrationId} className="pass-card">
                    <div className="card-info">
                      <div className="card-event">{event.name}</div>
                      <div className="card-attendee">
                        {reg.attendeeName} • {reg.ticketType}
                      </div>
                      <div className="card-meta">
                        <span>{reg.eventId}</span>
                        <span>&bull;</span>
                        <span>Pass: {effectiveStatus}</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      {pass && (
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => setViewPass(pass)}
                        >
                          View Pass
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === 'passes' && (
        <section>
          <h3 className="section-title">Passes</h3>
          {allPasses.length === 0 ? (
            <p className="empty">
              You don't have any passes yet.
            </p>
          ) : (
            <div className="pass-list">
              {[...allPasses].reverse().map((pass) => {
                const effective = getEffectiveStatus(pass, pass.eventEndDateTime);
                return (
                  <article key={pass.passId} className="pass-card">
                    <div className="card-info">
                      <div className="card-event">{pass.eventName}</div>
                      <div className="card-attendee">{pass.attendeeName}</div>
                      <div className="card-meta">
                        <span>{pass.ticketType}</span>
                        <span>&bull;</span>
                        <span>{pass.passId}</span>
                      </div>
                      <div className="card-meta">
                        <span className={badgeClass(effective)}>{effective}</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setViewPass(pass)}
                      >
                        View
                      </button>
                      {effective === 'ACTIVE' && (
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ marginLeft: 8 }}
                            onClick={() => {
                              const el = document.getElementById('event-pass');
                              if (el) {
                                downloadPassAsPdf(el, `pass-${pass.passId}.pdf`);
                              }
                            }}
                          >
                            Download
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => copyPassId(pass.passId)}
                            style={{ fontSize: '13px', padding: '6px 10px' }}
                          >
                            Copy ID
                          </button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
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
