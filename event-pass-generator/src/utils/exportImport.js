/**
 * Export and import helpers for app data (JSON).
 * Useful for demo backup/restore or migrating data between devices.
 *
 * Concepts used: JSON.stringify/parse, blob/download, file input reader.
 *
 * NOTE: This is a frontend prototype. Exported data contains user accounts
 * and passwords in plain text — do not share exported files publicly.
 */

import { STORAGE_KEYS, loadJson, saveJson } from './storage';

const EXPORT_VERSION = '1.0';

/**
 * Exports all app data as a JSON file download.
 */
export function exportData() {
  const data = {
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    events: loadJson('epg_events', []),
    passes: loadJson('epg_passes', []),
    registrations: loadJson('epg_registrations', []),
    users: loadJson('epg_users', []),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `event-pass-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Imports app data from a JSON file. Validates structure before overwriting.
 * Returns { ok, error }.
 */
export function importData(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (
          !data ||
          typeof data !== 'object' ||
          !Array.isArray(data.events) ||
          !Array.isArray(data.passes) ||
          !Array.isArray(data.registrations) ||
          !Array.isArray(data.users)
        ) {
          resolve({ ok: false, error: 'Invalid backup file format.' });
          return;
        }

        saveJson('epg_events', data.events);
        saveJson('epg_passes', data.passes);
        saveJson('epg_registrations', data.registrations);
        saveJson('epg_users', data.users);

        resolve({ ok: true });
      } catch {
        resolve({ ok: false, error: 'Failed to read backup file.' });
      }
    };
    reader.onerror = () => {
      resolve({ ok: false, error: 'Failed to read backup file.' });
    };
    reader.readAsText(file);
  });
}
