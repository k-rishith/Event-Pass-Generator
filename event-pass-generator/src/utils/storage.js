/**
 * Central storage helpers for events, passes, registrations, and users.
 * Uses browser localStorage with safe parsing and migration from legacy keys.
 *
 * Concepts used: localStorage API, JSON.parse/stringify, try/catch,
 * defensive coding (empty/corrupted data).
 *
 * NOTE: This is a frontend prototype. localStorage is per-browser/device and
 * does not provide secure authentication or cross-device one-time validation.
 */

const EVENTS_KEY = 'epg_events';
const PASSES_KEY = 'epg_passes';
const REGISTRATIONS_KEY = 'epg_registrations';
const USERS_KEY = 'epg_users';
const LEGACY_PASSES_KEY = 'event_pass_generator_passes';

/**
 * All localStorage keys managed by this app. Used by resetAllData().
 */
export const STORAGE_KEYS = [
  EVENTS_KEY,
  PASSES_KEY,
  REGISTRATIONS_KEY,
  USERS_KEY,
  LEGACY_PASSES_KEY,
];

/* ------------------------------------------------------------------ */
/* Low-level read/write                                               */
/* ------------------------------------------------------------------ */

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return parsed === null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

export { loadJson };

function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // localStorage unavailable or full
    return false;
  }
}

export { saveJson };

/* ------------------------------------------------------------------ */
/* ID generators                                                      */
/* ------------------------------------------------------------------ */

/**
 * Generates a unique event ID in the format EVENT-YYYY-XXXXX.
 */
export function generateEventId(existingIds = []) {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id;
  let attempts = 0;
  do {
    const suffix = Array.from({ length: 5 }, () => {
      return chars[Math.floor(Math.random() * chars.length)];
    }).join('');
    id = `EVENT-${year}-${suffix}`;
    attempts += 1;
  } while (existingIds.includes(id) && attempts < 1000);
  return id;
}

/**
 * Generates a unique pass ID in the format EVT-YYYY-XXXXX.
 */
export function generatePassId(existingIds = []) {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id;
  let attempts = 0;
  do {
    const suffix = Array.from({ length: 5 }, () => {
      return chars[Math.floor(Math.random() * chars.length)];
    }).join('');
    id = `EVT-${year}-${suffix}`;
    attempts += 1;
  } while (existingIds.includes(id) && attempts < 1000);
  return id;
}

/**
 * Generates a unique registration ID in the format REG-YYYY-XXXXX.
 */
export function generateRegistrationId(existingIds = []) {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id;
  let attempts = 0;
  do {
    const suffix = Array.from({ length: 5 }, () => {
      return chars[Math.floor(Math.random() * chars.length)];
    }).join('');
    id = `REG-${year}-${suffix}`;
    attempts += 1;
  } while (existingIds.includes(id) && attempts < 1000);
  return id;
}

/* ------------------------------------------------------------------ */
/* Users                                                              */
/* ------------------------------------------------------------------ */

export function loadUsers() {
  const users = loadJson(USERS_KEY, []);
  return Array.isArray(users) ? users : [];
}

export function saveUsers(users) {
  return saveJson(USERS_KEY, users);
}

/* ------------------------------------------------------------------ */
/* Events                                                             */
/* ------------------------------------------------------------------ */

export function loadEvents() {
  const events = loadJson(EVENTS_KEY, []);
  return Array.isArray(events) ? events : [];
}

export function saveEvents(events) {
  return saveJson(EVENTS_KEY, events);
}

/* ------------------------------------------------------------------ */
/* Passes                                                             */
/* ------------------------------------------------------------------ */

export function loadPasses() {
  const passes = loadJson(PASSES_KEY, []);
  return Array.isArray(passes) ? passes : [];
}

export function savePasses(passes) {
  return saveJson(PASSES_KEY, passes);
}

/* ------------------------------------------------------------------ */
/* Registrations                                                      */
/* ------------------------------------------------------------------ */

export function loadRegistrations() {
  const registrations = loadJson(REGISTRATIONS_KEY, []);
  return Array.isArray(registrations) ? registrations : [];
}

export function saveRegistrations(registrations) {
  return saveJson(REGISTRATIONS_KEY, registrations);
}

/**
 * Clears all app data from localStorage and returns empty initial state.
 * Intended for admin/demo reset — use with user confirmation.
 */
export function resetAllData() {
  STORAGE_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {}
  });
  return { events: [], passes: [], registrations: [], users: [] };
}

/* ------------------------------------------------------------------ */
/* Migration / normalization                                          */
/* ------------------------------------------------------------------ */

/**
 * Ensures every event has the new platform fields so the public listing,
 * ticket tiers, ownership, and status logic work uniformly.
 *
 * Old events (ticketTypes array) are migrated into ticketTiers with
 * price 0 and quantity equal to capacity.
 */
export function normalizeEvent(event) {
  const tiers = Array.isArray(event.ticketTiers) && event.ticketTiers.length > 0
    ? event.ticketTiers
    : (Array.isArray(event.ticketTypes) ? event.ticketTypes.map((t) => ({
        id: `tier-${t}`,
        name: t,
        price: 0,
        quantity: Number(event.capacity) || 0,
      })) : [
        { id: 'tier-regular', name: 'Regular', price: 0, quantity: Number(event.capacity) || 0 },
      ]);

  return {
    ...event,
    ownerId: event.ownerId || null,
    banner: event.banner || null,
    description: event.description || '',
    eventDate: event.eventDate || '',
    startTime: event.startTime || '00:00',
    endTime: event.endTime || '23:59',
    venue: event.venue || '',
    capacity: Number(event.capacity) || 0,
    ticketTiers: tiers,
    ticketTypes: tiers.map((t) => t.name),
    statusOverride: event.statusOverride || null,
    roles: event.roles || {},
    createdAt: event.createdAt || Date.now(),
  };
}

/**
 * Normalizes a pass to ensure required fields exist.
 */
export function normalizePass(pass) {
  return {
    ...pass,
    registrationId: pass.registrationId || null,
    userId: pass.userId || null,
    ticketPrice: Number(pass.ticketPrice) || 0,
    eventEndDateTime: pass.eventEndDateTime || null,
    status: pass.status || 'ACTIVE',
    createdAt: pass.createdAt || Date.now(),
  };
}

/**
 * Migrates old attendee passes stored under the legacy key into the new
 * events/passes structure so previously saved passes are not lost.
 */
export function migrateLegacyPasses() {
  const legacy = loadJson(LEGACY_PASSES_KEY, []);
  if (!Array.isArray(legacy) || legacy.length === 0) {
    return { events: [], passes: [], registrations: [], users: [] };
  }

  const events = [];
  const passes = [];
  const registrations = [];
  const users = [];
  const eventMap = new Map();
  const userMap = new Map();

  legacy.forEach((old) => {
    // Create/attach a synthetic user for the attendee email (demo only)
    const email = old.email || `attendee-${old.id || old.passId}@example.local`;
    if (!userMap.has(email)) {
      const userId = `USER-migrate-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const user = {
        id: userId,
        name: old.name || old.attendeeName || 'Migrated Attendee',
        email,
        password: 'migrated',
        createdAt: old.createdAt || Date.now(),
      };
      users.push(user);
      userMap.set(email, user);
    }
    const userId = userMap.get(email).id;

    const key = `${old.eventName}|${old.eventDate}|${old.venue}`;
    if (!eventMap.has(key)) {
      const eventId = generateEventId(events.map((e) => e.eventId));
      const event = normalizeEvent({
        eventId,
        name: old.eventName,
        description: 'Migrated event',
        eventDate: old.eventDate || '',
        startTime: '00:00',
        endTime: '23:59',
        venue: old.venue || '',
        capacity: 0,
        ticketTypes: ['Regular', 'VIP', 'Student'],
        createdAt: old.createdAt || Date.now(),
      });
      events.push(event);
      eventMap.set(key, event);
    }
    const event = eventMap.get(key);

    const passId = old.id || old.passId;
    const registrationId = generateRegistrationId(
      registrations.map((r) => r.registrationId)
    );

    const pass = normalizePass({
      passId,
      registrationId,
      eventId: event.eventId,
      userId,
      attendeeName: old.name || old.attendeeName || '',
      email,
      ticketType: old.ticketType || 'Regular',
      ticketPrice: 0,
      status: 'ACTIVE',
      createdAt: old.createdAt || Date.now(),
      eventEndDateTime: `${old.eventDate}T23:59`,
    });

    passes.push(pass);
    registrations.push({
      registrationId,
      eventId: event.eventId,
      userId,
      attendeeName: pass.attendeeName,
      email: pass.email,
      ticketTierId: `tier-${pass.ticketType}`,
      ticketType: pass.ticketType,
      ticketPrice: 0,
      passId,
      status: 'REGISTERED',
      createdAt: pass.createdAt,
    });
  });

  return { events, passes, registrations, users };
}

/**
 * Ensures storage is initialized: migrate legacy data once if new keys are empty.
 * Returns { events, passes, registrations, users, session }.
 */
export function initializeStorage() {
  const events = loadEvents().map(normalizeEvent);
  const passes = loadPasses().map(normalizePass);
  const registrations = loadRegistrations();
  const users = loadUsers();

  if (
    events.length === 0 &&
    passes.length === 0 &&
    registrations.length === 0 &&
    users.length === 0
  ) {
    const migrated = migrateLegacyPasses();
    if (
      migrated.events.length > 0 ||
      migrated.passes.length > 0 ||
      migrated.users.length > 0
    ) {
      saveEvents(migrated.events);
      savePasses(migrated.passes);
      saveRegistrations(migrated.registrations);
      saveUsers(migrated.users);
      return {
        events: migrated.events,
        passes: migrated.passes,
        registrations: migrated.registrations,
        users: migrated.users,
      };
    }
    // Fresh install: no data to seed; return empty state.
    return { events: [], passes: [], registrations: [], users: [] };
  }

  return { events, passes, registrations, users };
}
