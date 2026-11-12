import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { validatePassScan, getEffectiveStatus, badgeClass } from '../utils/passValidation';

/**
 * ScanPass
 * QR scanner to validate attendee passes for a selected event.
 *
 * Validation runs in strict order:
 *   1. Pass exists          -> INVALID PASS
 *   2. Correct event        -> INVALID PASS FOR THIS EVENT
 *   3. Cancelled            -> PASS CANCELLED
 *   4. Expiration           -> PASS EXPIRED
 *   5. Previous usage       -> PASS ALREADY USED
 *   6. Valid                -> ENTRY APPROVED (mark USED)
 *
 * Falls back to a manual Pass ID input when the camera is unavailable.
 *
 * Props:
 *   events                - all events (to scan under)
 *   passes                - all passes
 *   registrations         - all registrations
 *   onSavePasses          - callback to persist updated passes
 *   onSaveRegistrations   - callback to persist registrations
 *
 * Concepts used: useState, useEffect, useRef, props, third-party SDK,
 * validation logic separated from UI.
 */
export default function ScanPass({
  events,
  passes,
  registrations,
  onSavePasses,
  onSaveRegistrations,
}) {
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [result, setResult] = useState(null);
  const [manualId, setManualId] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');

  const eventOptions = events.map((event) => ({
    value: event.eventId,
    label: `${event.name} — ${event.eventDate}`,
  }));

  useEffect(() => {
    return () => {
      if (Html5Qrcode) {
        try {
          Html5Qrcode.stop().catch(() => {});
        } catch {}
      }
    };
  }, []);

  async function startScanner() {
    setCameraError(null);
    if (!Html5Qrcode) {
      setCameraError('QR scanner library not available. Use manual entry below.');
      return;
    }
    try {
      setScanning(true);
      await Html5Qrcode.startCamera(
        undefined,
        { fps: 10, qrbox: 250 },
        onScanSuccess,
        onScanError
      );
    } catch (err) {
      setScanning(false);
      setCameraError(
        'Camera access unavailable or denied. Use manual Pass ID entry below.'
      );
    }
  }

  function stopScanner() {
    setScanning(false);
    if (Html5Qrcode) {
      try {
        Html5Qrcode.stop().catch(() => {});
      } catch {}
    }
  }

  function onScanSuccess(decodedText) {
    stopScanner();
    handleValidate(decodedText.trim());
  }

  function onScanError() {
    // Non-fatal per-frame errors; ignore
  }

  function handleValidate(passId) {
    if (!passId) {
      setResult({ ok: false, code: 'INVALID_PASS', message: 'INVALID PASS', pass: null });
      return;
    }

    const validation = validatePassScan({
      passId,
      selectedEventId: selectedEventId || undefined,
      passes,
      events,
      now: Date.now(),
    });

    setResult(validation);

    if (validation.ok && validation.pass) {
      const nextPasses = passes.map((p) =>
        p.passId === passId ? validation.pass : p
      );
      const nextRegistrations = registrations.map((r) =>
        r.passId === passId ? { ...r, status: 'USED' } : r
      );
      onSavePasses(nextPasses);
      onSaveRegistrations(nextRegistrations);

      setTimeout(() => {
        setResult(null);
        setScanning(true);
        startScanner().catch(() => {});
      }, 3000);
    }
  }

  function handleManualValidate() {
    setResult(null);
    handleValidate(manualId);
  }

  function resetResult() {
    setResult(null);
  }

  return (
    <div>
      <h2 className="section-title">Scan Pass</h2>
      <p className="subtitle">
        Scan the attendee&apos;s QR code or enter the Pass ID manually. Entry is
        approved only once per pass.
      </p>

      {events.length > 0 && (
        <div className="form-group" style={{ width: 400, marginBottom: 16 }}>
          <label htmlFor="scanEvent">Scan for event</label>
          <select
            id="scanEvent"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            <option value="">Any event</option>
            {eventOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        {scanning ? (
          <>
            <button type="button" className="btn btn-danger" onClick={stopScanner}>
              Stop Scanner
            </button>
            <div id="qr-reader" style={{ width: 400, marginTop: 12 }}></div>
            {cameraError && (
              <p className="error-message" style={{ marginTop: 8 }}>{cameraError}</p>
            )}
          </>
        ) : (
          <>
            {cameraError && (
              <p className="error-message">{cameraError}</p>
            )}
            {!cameraError && (
              <button type="button" className="btn btn-primary" onClick={startScanner}>
                Start Camera Scanner
              </button>
            )}
          </>
        )}
      </div>

      <div style={{ marginTop: 20, padding: 16, border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', background: 'var(--color-bg)' }}>
        <p className="subtitle" style={{ marginBottom: 10, fontSize: 14, color: 'var(--color-text-secondary)' }}>
          Or enter Pass ID manually:
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            id="manualPassId"
            type="text"
            placeholder="e.g. EVT-2026-A7K92"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
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
          <button type="button" className="btn btn-primary" onClick={handleManualValidate}>
            Validate
          </button>
        </div>
      </div>

      {result && (
        <div
          className={`scan-result ${result.ok ? 'scan-result-approved' : 'scan-result-denied'}`}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              marginBottom: 12,
              color: result.ok ? 'var(--color-success)' : 'var(--color-danger)',
            }}
          >
            {result.ok ? '✓ VALID PASS' : `✕ ${result.message}`}
          </div>
          {result.pass && (
            <div className="scan-result-details">
              <div className="scan-detail">
                <span className="scan-detail-label">Username</span>
                <span className="scan-detail-value">{result.pass.attendeeName || '—'}</span>
              </div>
              <div className="scan-detail">
                <span className="scan-detail-label">Event</span>
                <span className="scan-detail-value">{result.pass.eventName || '—'}</span>
              </div>
              <div className="scan-detail">
                <span className="scan-detail-label">Location</span>
                <span className="scan-detail-value">{result.pass.venue || '—'}</span>
              </div>
              <div className="scan-detail">
                <span className="scan-detail-label">Unique Code</span>
                <span className="scan-detail-value" style={{ fontFamily: 'var(--font-mono)' }}>{result.pass.passId || '—'}</span>
              </div>
              <div className="scan-detail">
                <span className="scan-detail-label">Ticket</span>
                <span className="scan-detail-value">{result.pass.ticketType || '—'}</span>
              </div>
              <div className="scan-detail">
                <span className="scan-detail-label">Status</span>
                <span className={badgeClass(result.ok ? 'USED' : getEffectiveStatus(result.pass, result.pass.eventEndDateTime))}>
                  {result.ok ? 'USED' : getEffectiveStatus(result.pass, result.pass.eventEndDateTime)}
                </span>
              </div>
            </div>
          )}
          {!result.ok && (
            <p style={{ marginTop: 12, fontSize: 14, color: 'var(--color-text-secondary)' }}>
              Entry denied.
            </p>
          )}
          <div style={{ marginTop: 16 }}>
            {!result.ok && (
              <button type="button" className="btn btn-outline" onClick={resetResult}>
                Try Again
              </button>
            )}
          </div>
        </div>
      )}

      <p className="empty" style={{ marginTop: 24, fontSize: 13 }}>
        Note: This is a frontend prototype using browser localStorage. For a
        real production system, scanning must validate against a centralized
        backend so a pass marked USED on one device cannot be reused on another.
      </p>
    </div>
  );
}
