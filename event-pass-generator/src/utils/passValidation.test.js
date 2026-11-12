import {
  getEffectiveStatus,
  validatePassScan,
  computeEventStats,
  badgeClass,
} from './passValidation';

const now = new Date('2026-11-15T12:00:00').getTime();

describe('getEffectiveStatus', () => {
  it('returns ACTIVE for active pass before end time', () => {
    const pass = { status: 'ACTIVE', eventEndDateTime: '2026-11-15T17:00:00' };
    expect(getEffectiveStatus(pass, '2026-11-15T17:00:00', now)).toBe('ACTIVE');
  });

  it('returns USED for used pass regardless of time', () => {
    const pass = { status: 'USED', eventEndDateTime: '2026-11-15T17:00:00' };
    expect(getEffectiveStatus(pass, '2026-11-15T17:00:00', now)).toBe('USED');
  });

  it('returns CANCELLED for cancelled pass', () => {
    const pass = { status: 'CANCELLED', eventEndDateTime: '2026-11-15T17:00:00' };
    expect(getEffectiveStatus(pass, '2026-11-15T17:00:00', now)).toBe('CANCELLED');
  });

  it('returns EXPIRED for active pass after end time', () => {
    const pass = { status: 'ACTIVE', eventEndDateTime: '2026-11-15T10:00:00' };
    expect(getEffectiveStatus(pass, '2026-11-15T10:00:00', now)).toBe('EXPIRED');
  });
});

describe('validatePassScan', () => {
  const passes = [
    {
      passId: 'EVT-2026-AAAAA',
      eventId: 'EVENT-1',
      attendeeName: 'John Doe',
      ticketType: 'VIP',
      status: 'ACTIVE',
      eventEndDateTime: '2026-11-15T17:00:00',
    },
    {
      passId: 'EVT-2026-BBBBB',
      eventId: 'EVENT-1',
      attendeeName: 'Jane Smith',
      ticketType: 'Regular',
      status: 'USED',
      eventEndDateTime: '2026-11-15T17:00:00',
    },
    {
      passId: 'EVT-2026-CCCCC',
      eventId: 'EVENT-2',
      attendeeName: 'Wrong Event',
      ticketType: 'Student',
      status: 'ACTIVE',
      eventEndDateTime: '2026-11-15T17:00:00',
    },
  ];

  const events = [
    { eventId: 'EVENT-1', eventDate: '2026-11-15', endTime: '17:00' },
    { eventId: 'EVENT-2', eventDate: '2026-11-15', endTime: '17:00' },
  ];

  it('approves valid active pass for correct event', () => {
    const result = validatePassScan({
      passId: 'EVT-2026-AAAAA',
      selectedEventId: 'EVENT-1',
      passes,
      events,
      now,
    });
    expect(result.ok).toBe(true);
    expect(result.code).toBe('ENTRY_APPROVED');
  });

  it('denies unknown pass ID', () => {
    const result = validatePassScan({
      passId: 'EVT-99999-ZZZZZ',
      selectedEventId: 'EVENT-1',
      passes,
      events,
      now,
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe('INVALID_PASS');
  });

  it('denies wrong event', () => {
    const result = validatePassScan({
      passId: 'EVT-2026-CCCCC',
      selectedEventId: 'EVENT-1',
      passes,
      events,
      now,
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe('WRONG_EVENT');
  });

  it('denies already used pass', () => {
    const result = validatePassScan({
      passId: 'EVT-2026-BBBBB',
      selectedEventId: 'EVENT-1',
      passes,
      events,
      now,
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe('PASS_ALREADY_USED');
  });
});

describe('computeEventStats', () => {
  it('computes stats correctly', () => {
    const event = { eventId: 'EVENT-1', eventDate: '2026-11-15', endTime: '17:00' };
    const passes = [
      { eventId: 'EVENT-1', status: 'ACTIVE', eventEndDateTime: '2026-11-15T17:00:00' },
      { eventId: 'EVENT-1', status: 'USED', eventEndDateTime: '2026-11-15T17:00:00' },
      { eventId: 'EVENT-1', status: 'CANCELLED', eventEndDateTime: '2026-11-15T17:00:00' },
      { eventId: 'EVENT-2', status: 'ACTIVE', eventEndDateTime: '2026-11-15T17:00:00' },
    ];
    const stats = computeEventStats(event, passes, now);
    expect(stats.total).toBe(3);
    expect(stats.active).toBe(1);
    expect(stats.used).toBe(1);
    expect(stats.cancelled).toBe(1);
  });
});

describe('badgeClass', () => {
  it('returns correct classes for each status', () => {
    expect(badgeClass('ACTIVE')).toContain('badge-active');
    expect(badgeClass('USED')).toContain('badge-used');
    expect(badgeClass('EXPIRED')).toContain('badge-expired');
    expect(badgeClass('CANCELLED')).toContain('badge-cancelled');
  });
});
