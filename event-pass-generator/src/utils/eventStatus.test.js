import {
  getEventState,
  getAvailableSeats,
  getTierAvailable,
  stateLabel,
} from './eventStatus';

const now = new Date('2026-11-15T12:00:00').getTime();

const event = {
  eventId: 'EVENT-1',
  name: 'Test Event',
  eventDate: '2026-11-15',
  startTime: '10:00',
  endTime: '17:00',
  venue: 'Test Venue',
  capacity: 100,
};

describe('getEventState', () => {
  it('returns UPCOMING before start time', () => {
    const earlyNow = new Date('2026-11-15T09:00:00').getTime();
    expect(getEventState(event, [], earlyNow)).toBe('UPCOMING');
  });

  it('returns ONGOING during event', () => {
    expect(getEventState(event, [], now)).toBe('ONGOING');
  });

  it('returns COMPLETED after end time', () => {
    const lateNow = new Date('2026-11-15T18:00:00').getTime();
    expect(getEventState(event, [], lateNow)).toBe('COMPLETED');
  });

  it('returns SOLD OUT when no seats left', () => {
    const registrations = Array(100).fill({ eventId: 'EVENT-1' });
    expect(getEventState(event, registrations, now)).toBe('SOLD OUT');
  });

  it('returns CANCELLED when statusOverride is CANCELLED', () => {
    const cancelledEvent = { ...event, statusOverride: 'CANCELLED' };
    expect(getEventState(cancelledEvent, [], now)).toBe('CANCELLED');
  });
});

describe('getAvailableSeats', () => {
  it('returns capacity when no registrations', () => {
    expect(getAvailableSeats(event, [])).toBe(100);
  });

  it('returns remaining seats after registrations', () => {
    const registrations = Array(30).fill({ eventId: 'EVENT-1' });
    expect(getAvailableSeats(event, registrations)).toBe(70);
  });

  it('returns 0 when over capacity', () => {
    const registrations = Array(150).fill({ eventId: 'EVENT-1' });
    expect(getAvailableSeats(event, registrations)).toBe(0);
  });
});

describe('getTierAvailable', () => {
  it('returns tier quantity when no registrations for tier', () => {
    const eventWithTiers = {
      ...event,
      ticketTiers: [{ name: 'VIP', quantity: 50 }],
    };
    expect(getTierAvailable(eventWithTiers, 'VIP', [])).toBe(50);
  });

  it('returns remaining tier seats after registrations', () => {
    const eventWithTiers = {
      ...event,
      ticketTiers: [{ name: 'VIP', quantity: 50 }],
    };
    const registrations = Array(10).fill({
      eventId: 'EVENT-1',
      ticketType: 'VIP',
    });
    expect(getTierAvailable(eventWithTiers, 'VIP', registrations)).toBe(40);
  });
});

describe('stateLabel', () => {
  it('returns human readable labels', () => {
    expect(stateLabel('UPCOMING')).toBe('Upcoming');
    expect(stateLabel('OPEN')).toBe('Registration Open');
    expect(stateLabel('SOLD OUT')).toBe('Sold Out');
    expect(stateLabel('COMPLETED')).toBe('Event Ended');
    expect(stateLabel('CANCELLED')).toBe('Cancelled');
  });
});
