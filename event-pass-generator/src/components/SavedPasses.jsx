/**
 * SavedPasses
 * Displays the "My Passes" list of previously generated passes.
 *
 * Props:
 *   savedPasses - array of pass objects
 *   onView      - called to view a saved pass: (pass) => {}
 *   onDelete    - called to delete a saved pass: (passId) => {}
 *
 * Concepts used: map() to render a list, conditional rendering (empty state), props.
 */
export default function SavedPasses({ savedPasses, onView, onDelete }) {
  return (
    <section className="saved-section">
      <h2 className="section-title">My Passes</h2>
      {savedPasses.length === 0 ? (
        <p className="empty">
          No saved passes yet. Generate a pass to get started.
        </p>
      ) : (
        <div className="pass-list">
          {savedPasses.map((pass) => (
            <PassCard
              key={pass.id}
              pass={pass}
              onView={onView}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * PassCard
 * A single saved pass with View and Delete actions.
 *
 * Concepts used: props, filter() is used in the parent to remove items.
 */
function PassCard({ pass, onView, onDelete }) {
  return (
    <article className="pass-card">
      <div className="card-info">
        <div className="card-event">{pass.eventName}</div>
        <div className="card-attendee">{pass.name}</div>
        <div className="card-meta">
          <span>{pass.ticketType}</span>
          <span>&bull;</span>
          <span>{pass.id}</span>
        </div>
      </div>
      <div className="card-actions">
        <button
          type="button"
          className="btn btn-outline btn-view"
          onClick={() => onView(pass)}
        >
          View
        </button>
        <button
          type="button"
          className="btn btn-danger btn-delete"
          onClick={() => onDelete(pass.id)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
