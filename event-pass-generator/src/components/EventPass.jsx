import { QRCodeSVG as QRCode } from 'qrcode.react';

/**
 * EventPass
 * Renders the digital event pass for a single pass object.
 *
 * Props:
 *   pass       - the pass object to display (null means "nothing to show")
 *   onDownload - called when the user clicks Download Pass
 *
 * Concepts used: conditional rendering, props, third-party component,
 * formatting data for display, dynamic class names.
 */
export default function EventPass({ pass, onDownload, onCopyPassId }) {
  if (!pass) {
    return null;
  }

  function formatDate(isoDate) {
    const date = new Date(`${isoDate}T00:00:00`);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  /* QR code contains only the unique Pass ID (never sensitive personal data).
     The scanner looks up the actual pass data by this ID. */
  const qrData = pass.passId || pass.id;

  /* Tier-based animation class applied to the pass container. */
  const tier = String(pass.ticketType || '').toLowerCase();
  let tierClass = 'pass-tier-standard';
  if (tier === 'student') tierClass = 'pass-tier-student';
  else if (tier === 'regular') tierClass = 'pass-tier-regular';
  else if (tier === 'vip') tierClass = 'pass-tier-vip';
  else if (tier === 'premium') tierClass = 'pass-tier-premium';

  function handleCopyPassId() {
    const passId = pass.passId || pass.id;
    if (!passId) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(passId).then(() => {
        if (onCopyPassId) onCopyPassId(passId, true);
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = passId;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        if (onCopyPassId) onCopyPassId(passId, true);
      } catch {
        if (onCopyPassId) onCopyPassId(passId, false);
      } finally {
        document.body.removeChild(textArea);
      }
    }
  }

  return (
    <section className="pass-section">
      <h2 className="section-title">Generated Pass</h2>
      <div
        className={`event-pass pass-card-container ${tierClass}`}
        id="event-pass"
      >
        <div className="pass-header">
          <div className="event-name">{pass.eventName}</div>
          <div className="ticket-type">
            {pass.ticketType.toUpperCase()} PASS
          </div>
        </div>
        <div className="pass-body">
          <div className="attendee">{pass.attendeeName || pass.name}</div>
          <div className="detail-row">
            <span className="label">Email</span>
            <span className="value">{pass.email}</span>
          </div>
          <div className="detail-row">
            <span className="label">Date</span>
            <span className="value">{pass.eventDate ? formatDate(pass.eventDate) : '—'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Time</span>
            <span className="value">{pass.startTime ? `${pass.startTime} - ${pass.endTime}` : '—'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Venue</span>
            <span className="value">{pass.venue || '—'}</span>
          </div>
          <div className="qr-wrapper">
            <QRCode value={qrData} size={120} level="M" />
            <span className="qr-label">Scan to verify pass</span>
          </div>
        </div>
        <div className="pass-footer">
          <span className="pass-id-label">PASS ID</span>
          <div className="pass-id">{pass.passId || pass.id}</div>
          <span className="pass-status">
            {pass.status === 'USED' ? 'USED' : pass.status === 'CANCELLED' ? 'CANCELLED' : 'ACTIVE'}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
        <button type="button" className="btn btn-primary" onClick={onDownload}>
          Download Pass
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={handleCopyPassId}
        >
          Copy Pass ID
        </button>
      </div>
    </section>
  );
}
