import { useState, Suspense, lazy } from 'react';
import { seedDemoData } from '../utils/seedDemo';
import { exportData, importData } from '../utils/exportImport';
import { resetAllData } from '../utils/storage';
import Overview from './Overview';
import CreateEvent from './CreateEvent';
import MyEvents from './MyEvents';
import ManagePasses from './ManagePasses';
const ScanPass = lazy(() => import('./ScanPass'));
import ManageEvent from './ManageEvent';

const SECTIONS = [
  { key: 'overview', label: 'Overview' },
  { key: 'create', label: 'Create Event' },
  { key: 'events', label: 'Events' },
  { key: 'passes', label: 'Manage Passes' },
  { key: 'scan', label: 'Scan Pass' },
];

/**
 * OrganizerDashboard
 * Organizer area for creating and managing events, passes, and entry
 * scanning. No sign-in is required — everyone on this device can create
 * events and manage all events/passes.
 *
 * Props:
 *   events             - all created events
 *   passes             - all generated passes
 *   registrations      - all registrations
 *   users              - all users (legacy compat, unused)
 *   onSaveEvents       - callback to persist updated events
 *   onSavePasses       - callback to persist updated passes
 *   onSaveRegistrations- callback to persist registrations
 *   onSaveUsers        - callback to persist users (legacy compat)
 *   addToast           - callback to show toast notifications
 *
 * Concepts used: useState, Suspense, lazy, props, conditional rendering.
 */
export default function OrganizerDashboard({
  events,
  passes,
  registrations,
  users,
  addToast,
  onSaveEvents,
  onSavePasses,
  onSaveRegistrations,
  onSaveUsers,
}) {
  const [section, setSection] = useState('overview');
  const [manageEventId, setManageEventId] = useState(null);
  const [now] = useState(Date.now());
  const [importFile, setImportFile] = useState(null);

  // No ownership or admin scoping — everyone can manage all events.
  const dashboardEvents = events;

  function handleSeedDemo() {
    if (!window.confirm('This will add sample events, registrations, and passes. Continue?')) {
      return;
    }
    const { events: seededEvents, passes: seededPasses, registrations: seededRegs } =
      seedDemoData(events, passes, registrations, users);
    onSaveEvents(seededEvents);
    onSavePasses(seededPasses);
    onSaveRegistrations(seededRegs);
    addToast({ type: 'success', message: 'Demo data seeded.' });
  }

  function handleExportData() {
    exportData();
    addToast({ type: 'success', message: 'Data exported.' });
  }

  async function handleImportData() {
    if (!importFile) return;
    const result = await importData(importFile);
    if (result.ok) {
      // Reload to reflect imported data
      window.location.reload();
    } else {
      addToast({ type: 'error', message: result.error });
    }
  }

  function handleResetData() {
    if (
      !window.confirm(
        'WARNING: This will delete ALL data (users, events, passes, registrations). This cannot be undone. Continue?'
      )
    ) {
      return;
    }
    const next = resetAllData();
    setEvents(next.events);
    setPasses(next.passes);
    setRegistrations(next.registrations);
    setUsers(next.users);
    addToast({ type: 'success', message: 'All data has been reset.' });
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 className="section-title">Organizer Dashboard</h2>
      </div>
      <p className="subtitle">
        Manage events, passes, and entry scanning on this device.
      </p>

      <div
        style={{
          background: '#fffbeb',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          padding: '16px',
          marginBottom: 20,
        }}
      >
        <h3 className="section-title" style={{ marginBottom: 10 }}>
          Data Management
        </h3>
        <p className="subtitle" style={{ marginBottom: 10, fontSize: 13 }}>
          Prototype tools for demo and testing.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSeedDemo}
          >
            Seed Demo Data
          </button>
          <button type="button" className="btn btn-outline" onClick={handleExportData}>
            Export Data
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            Import Data
            <input
              type="file"
              accept=".json"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              style={{}}
            />
          </label>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => handleImportData()}
            disabled={!importFile}
          >
            Import
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleResetData}
          >
            Reset All Data
          </button>
        </div>
      </div>

      {manageEventId && (
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setManageEventId(null)}
          >
            ← Back to Dashboard
          </button>
          <ManageEvent
            eventId={manageEventId}
            events={events}
            passes={passes}
            registrations={registrations}
            addToast={addToast}
            onSaveEvents={onSaveEvents}
            onSavePasses={onSavePasses}
            onSaveRegistrations={onSaveRegistrations}
          />
        </div>
      )}

      {!manageEventId && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setManageEventId(null);
                  setSection(s.key);
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {section === 'overview' && (
            <Overview events={dashboardEvents} passes={passes} registrations={registrations} />
          )}
          {section === 'create' && (
            <CreateEvent
              events={events}
              onSaveEvents={onSaveEvents}
            />
          )}
          {section === 'events' && (
            <MyEvents
              events={dashboardEvents}
              passes={passes}
              onManageEvent={(eventId) => setManageEventId(eventId)}
            />
          )}
          {section === 'passes' && (
            <ManagePasses
              events={dashboardEvents}
              passes={passes}
              registrations={registrations}
              onSavePasses={onSavePasses}
              now={now}
            />
          )}
          {section === 'scan' && (
            <Suspense fallback={<p className="subtitle">Loading QR scanner...</p>}>
              <ScanPass
                events={dashboardEvents}
                passes={passes}
                registrations={registrations}
                onSavePasses={onSavePasses}
                onSaveRegistrations={onSaveRegistrations}
              />
            </Suspense>
          )}
        </>
      )}
    </div>
  );
}
