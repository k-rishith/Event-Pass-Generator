/**
 * Pass validation logic — single source of truth.
 * Pure functions with no React/UI dependencies so they can be reused by
 * the scanner, dashboard counts, and manage-pass display without duplication.
 *
 * Statuses: ACTIVE | USED | EXPIRED | CANCELLED
 *   USED / CANCELLED are stored statuses.
 *   EXPIRED is computed: now > event end time and status is not USED/CANCELLED.
 *
 * Concepts used: pure functions, date comparison, array find/filter/some.
 */

const STATUS_ACTIVE = 'ACTIVE';
const STATUS_USED = 'USED';
const STATUS_EXPIRED = 'EXPIRED';
const STATUS_CANCELLED = 'CANCELLED';

/**
 * Returns the effective status of a pass for a given point in time.
 * If the stored status is USED or CANCELLED, that takes precedence.
 * If ACTIVE but the event end time has passed, returns EXPIRED.
 */
export function getEffectiveStatus(pass, eventEndDateTime, now = Date.now()) {
  if (pass.status === STATUS_USED) {
    return STATUS_USED;
  }
  if (pass.status === STATUS_CANCELLED) {
    return STATUS_CANCELLED;
  }
  const end = new Date(pass.eventEndDateTime || eventEndDateTime).getTime();
  if (!isNaN(end) && now > end) {
    return STATUS_EXPIRED;
  }
  return STATUS_ACTIVE;
}

/**
 * Finds a pass by passId across all passes.
 */
export function findPassById(passId, passes) {
  return passes.find((pass) => pass.passId === passId) || null;
}

/**
 * Finds an event by eventId across all events.
 */
export function findEventById(eventId, events) {
  return events.find((event) => event.eventId === eventId) || null;
}

/**
 * Runs the ordered validation rules for scanning a pass under a selected event.
 * Rule order (per spec):
 *   1. Pass exists                        -> INVALID PASS
 *   2. Correct event                      -> INVALID PASS FOR THIS EVENT
 *   3. Cancelled                          -> PASS CANCELLED
 *   4. Expiration                         -> PASS EXPIRED
 *   5. Previous usage                     -> PASS ALREADY USED
 *   6. Valid                              -> ENTRY APPROVED (mark USED)
 *
 * Returns { ok, code, message, pass } where code is one of:
 *   INVALID_PASS, WRONG_EVENT, CANCELLED_PASS,
 *   EXPIRED_PASS, PASS_ALREADY_USED, ENTRY_APPROVED
 */
export function validatePassScan({ passId, selectedEventId, passes, events, now }) {
  const pass = findPassById(passId, passes);

  // Rule 1 — Pass exists
  if (!pass) {
    return { ok: false, code: 'INVALID_PASS', message: 'INVALID PASS', pass: null };
  }

  const event = findEventById(selectedEventId, events);
  const eventEndDateTime = event ? `${event.eventDate}T${event.endTime}` : pass.eventEndDateTime;

  // Rule 2 — Correct event
  if (pass.eventId !== selectedEventId) {
    return {
      ok: false,
      code: 'WRONG_EVENT',
      message: 'INVALID PASS FOR THIS EVENT',
      pass,
    };
  }

  // Rule 3 — Cancelled
  if (pass.status === STATUS_CANCELLED) {
    return { ok: false, code: 'CANCELLED_PASS', message: 'PASS CANCELLED', pass };
  }

  // Rule 4 — Expiration
  const effectiveStatus = getEffectiveStatus(pass, eventEndDateTime, now);
  if (effectiveStatus === STATUS_EXPIRED) {
    return { ok: false, code: 'EXPIRED_PASS', message: 'PASS EXPIRED', pass };
  }

  // Rule 5 — Previous usage
  if (pass.status === STATUS_USED) {
    return { ok: false, code: 'PASS_ALREADY_USED', message: 'PASS ALREADY USED', pass };
  }

  // Rule 6 — Valid: approve entry and mark USED
  const updatedPass = { ...pass, status: STATUS_USED };
  return { ok: true, code: 'ENTRY_APPROVED', message: 'ENTRY APPROVED', pass: updatedPass };
}

/**
 * Computes dashboard stat counts for an event using effective statuses.
 */
export function computeEventStats(event, passes, now = Date.now()) {
  const eventPasses = passes.filter((pass) => pass.eventId === event.eventId);
  const end = new Date(`${event.eventDate}T${event.endTime}`).getTime();

  const stats = {
    total: eventPasses.length,
    active: 0,
    used: 0,
    expired: 0,
    cancelled: 0,
  };

  eventPasses.forEach((pass) => {
    const status = getEffectiveStatus(pass, `${event.eventDate}T${event.endTime}`, now);
    if (status === STATUS_ACTIVE) stats.active += 1;
    else if (status === STATUS_USED) stats.used += 1;
    else if (status === STATUS_EXPIRED) stats.expired += 1;
    else if (status === STATUS_CANCELLED) stats.cancelled += 1;
  });

  return stats;
}

/**
 * Status label styling helpers (return Tailwind-like class names mapped to our CSS).
 */
export function badgeClass(status) {
  switch (status) {
    case STATUS_ACTIVE: return 'badge badge-active';
    case STATUS_USED: return 'badge badge-used';
    case STATUS_EXPIRED: return 'badge badge-expired';
    case STATUS_CANCELLED: return 'badge badge-cancelled';
    default: return 'badge';
  }
}
