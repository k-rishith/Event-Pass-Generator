import { useState, useEffect } from 'react';

/**
 * Toast
 * Simple toast notification component.
 *
 * Props:
 *   toasts    - array of { id, type, message }
 *   onDismiss - called to remove a toast by id
 *
 * Concepts used: useState, useEffect, props, conditional rendering, map().
 */
export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) {
    return null;
  }

  useEffect(() => {
    const timers = toasts.map((t) =>
      setTimeout(() => onDismiss(t.id), 4000)
    );
    return () => timers.forEach((t) => clearTimeout(t));
  }, [toasts, onDismiss]);

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          role="alert"
          aria-live="polite"
        >
          <span className="toast-message">{t.message}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
