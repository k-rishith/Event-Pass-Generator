/**
 * Event status and availability helpers.
 * Pure functions with no React/UI dependencies.
 *
 * Event states:
 *   CANCELLED   - owner cancelled the event (statusOverride)
 *   COMPLETED   - event end time has passed
 *   ONGOING     - between start time and end time
 *   SOLD OUT    - no seats left
 *   OPEN        - registration is open (between now and start, seats available)
 *   UPCOMING    - event date/time is in the future (registration not yet open)
 *
 * Concepts used: pure functions, date comparison, array filter/reduce.
 */

const NOW_BUFFER_MS = 0;

/**
 * Builds a Date from an event's date + time strings (local time).
 */
function eventDateTime(event, timeField) {
  return new Date(`${event.eventDate}T${event[timeField]}`).getTime();
}

/**
 * Returns the effective state of an event based on time and availability.
 */
export function getEventState(event, registrations, now = Date.now()) {
  if (event.statusOverride === 'CANCELLED') {
    return 'CANCELLED';
  }

  const endTime = eventDateTime(event, 'endTime');
  const startTime = eventDateTime(event, 'startTime');

  if (now > endTime) {
    return 'COMPLETED';
  }

  const availableSeats = getAvailableSeats(event, registrations);
  if (availableSeats <= 0) {
    return 'SOLD OUT';
  }

  if (now >= startTime && now <= endTime) {
    return 'ONGOING';
  }

  if (now < startTime) {
    return 'UPCOMING';
  }

  return 'OPEN';
}

/**
 * Returns the number of available seats for an event.
 */
export function getAvailableSeats(event, registrations) {
  const used = registrations.filter((r) => r.eventId === event.eventId).length;
  return Math.max(0, (Number(event.capacity) || 0) - used);
}

/**
 * Returns remaining seats for a specific ticket tier.
 */
export function getTierAvailable(event, tierName, registrations) {
  const used = registrations.filter(
    (r) => r.eventId === event.eventId && r.ticketType === tierName
  ).length;
  const tier = (event.ticketTiers || []).find((t) => t.name === tierName);
  const capacity = tier ? Number(tier.quantity) : (Number(event.capacity) || 0);
  return Math.max(0, capacity - used);
}

/**
 * Returns a human-friendly label for an event state.
 */
export function stateLabel(state) {
  switch (state) {
    case 'UPCOMING': return 'Upcoming';
    case 'OPEN': return 'Registration Open';
    case 'ONGOING': return 'Ongoing';
    case 'SOLD OUT': return 'Sold Out';
    case 'COMPLETED': return 'Event Ended';
    case 'CANCELLED': return 'Cancelled';
    default: return state;
  }
}
