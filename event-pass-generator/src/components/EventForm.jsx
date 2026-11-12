import { useRef } from 'react';

/**
 * EventForm
 * A controlled form for attendee and event details.
 *
 * Props:
 *   formData      - current input values
 *   onChange      - called when any input changes: (fieldName, value) => {}
 *   errors        - validation messages { fieldName: string }
 *   onGenerate    - called when the user submits: (formData) => {}
 *   ticketTypes   - array of ticket type options
 *   eventLock     - when provided, event fields are prefilled and disabled
 *
 * Concepts used: controlled inputs, event handlers, form submission, props,
 * accessibility (aria-invalid, aria-describedby, focus management).
 */
export default function EventForm({
  formData,
  onChange,
  errors,
  onGenerate,
  ticketTypes,
  eventLock,
}) {
  const firstErrorRef = useRef(null);

  function handleSubmit(event) {
    event.preventDefault();

    // Focus the first field with an error
    if (firstErrorRef.current) {
      firstErrorRef.current.focus();
    }

    onGenerate(formData);
  }

  const isLocked = (key) =>
    Boolean(
      eventLock &&
        ['eventName', 'eventDate', 'venue', 'ticketType'].includes(key)
    );

  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <form className="event-form" onSubmit={handleSubmit} noValidate>
      {eventLock && (
        <p className="subtitle">
          Event details are locked to the selected event:{' '}
          <strong>{eventLock.eventName}</strong>.
        </p>
      )}
      <div className="form-grid">
        {[
          {
            key: 'name',
            label: 'Attendee Name',
            type: 'text',
            value: formData.name,
          },
          {
            key: 'email',
            label: 'Email',
            type: 'email',
            value: formData.email,
          },
          {
            key: 'eventName',
            label: 'Event Name',
            type: 'text',
            value: eventLock ? eventLock.eventName : formData.eventName,
            disabled: isLocked('eventName'),
          },
          {
            key: 'eventDate',
            label: 'Event Date',
            type: 'date',
            value: eventLock ? eventLock.eventDate : formData.eventDate,
            disabled: isLocked('eventDate'),
          },
          {
            key: 'venue',
            label: 'Venue',
            type: 'text',
            value: eventLock ? eventLock.venue : formData.venue,
            disabled: isLocked('venue'),
          },
          {
            key: 'ticketType',
            label: 'Ticket Type',
            type: 'select',
            value: eventLock ? eventLock.ticketType : formData.ticketType,
            options: eventLock ? [eventLock.ticketType] : ticketTypes,
            disabled: isLocked('ticketType'),
          },
        ].map((field) => {
          const error = errors[field.key];
          const errorId = `error-${field.key}`;
          return (
            <div key={field.key} className="form-group">
              <label htmlFor={field.key}>{field.label}</label>
              {field.type === 'select' ? (
                <select
                  id={field.key}
                  value={field.value}
                  disabled={field.disabled}
                  aria-invalid={error ? 'true' : 'false'}
                  aria-describedby={error ? errorId : undefined}
                  onChange={(event) => onChange(field.key, event.target.value)}
                >
                  <option value="">Select ticket type</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={field.key}
                  type={field.type}
                  value={field.value}
                  disabled={field.disabled}
                  aria-invalid={error ? 'true' : 'false'}
                  aria-describedby={error ? errorId : undefined}
                  ref={
                    error && hasErrors && !firstErrorRef.current
                      ? firstErrorRef
                      : undefined
                  }
                  onChange={(event) => onChange(field.key, event.target.value)}
                />
              )}
              {error && (
                <span id={errorId} className="error-message">
                  {error}
                </span>
              )}
            </div>
          );
        })}
      </div>
      <button type="submit" className="btn btn-primary btn-generate">
        Generate Pass
      </button>
    </form>
  );
}
