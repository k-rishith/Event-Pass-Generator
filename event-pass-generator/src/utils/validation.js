/**
 * Form validation helpers.
 *
 * Concepts used: pure functions, regular expression, object handling.
 */

/* Simple check: something@something.something */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return EMAIL_REGEX.test(String(email).trim());
}

/**
 * Validates the form data and returns an errors object.
 * Empty strings mean "no error" for that field.
 *
 * @param {Object} data - { name, email, eventName, eventDate, venue, ticketType }
 * @returns {Object} errors keyed by field name
 */
export function validateForm(data) {
  const errors = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Name is required.';
  }

  if (!data.email || !data.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!data.eventName || !data.eventName.trim()) {
    errors.eventName = 'Event name is required.';
  }

  if (!data.eventDate) {
    errors.eventDate = 'Event date is required.';
  }

  if (!data.venue || !data.venue.trim()) {
    errors.venue = 'Venue is required.';
  }

  if (!data.ticketType) {
    errors.ticketType = 'Ticket type is required.';
  }

  return errors;
}

/**
 * Returns true when any validation error message is present.
 */
export function hasErrors(errors) {
  return Object.values(errors).some((message) => message);
}
