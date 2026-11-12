/**
 * Seed demo data for demonstration purposes.
 * Creates sample events, registrations, and passes so users can
 * immediately explore the organizer dashboard and scanner.
 *
 * Concepts used: array helpers, Date manipulation, ID generators.
 *
 * NOTE: Only call this when demo data is explicitly requested.
 * Do not seed automatically on every load.
 */
import {
  generateEventId,
  generatePassId,
  generateRegistrationId,
} from './storage';

/**
 * Seeds demo events, registrations, and passes.
 * Returns { events, passes, registrations } arrays ready to save.
 */
export function seedDemoData(existingEvents, existingPasses, existingRegistrations, existingUsers) {
  // Don't seed if events already exist
  if (existingEvents.length > 0) {
    return { events: existingEvents, passes: existingPasses, registrations: existingRegistrations };
  }

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  const events = [
    {
      eventId: generateEventId([]),
      ownerId: null,
      name: 'TechFest 2026',
      description: 'Annual technology festival with workshops, talks, and networking.',
      banner: null,
      eventDate: new Date(now + 7 * oneDay).toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '17:00',
      venue: 'Hyderabad International Convention Centre',
      capacity: 500,
      ticketTiers: [
        { id: 'tier-student', name: 'Student', price: 199, quantity: 150 },
        { id: 'tier-regular', name: 'Regular', price: 399, quantity: 250 },
        { id: 'tier-vip', name: 'VIP', price: 999, quantity: 100 },
      ],
      ticketTypes: ['Student', 'Regular', 'VIP'],
      statusOverride: null,
      roles: {},
      createdAt: now - 2 * oneDay,
    },
    {
      eventId: generateEventId([]),
      ownerId: null,
      name: 'AI Workshop 2026',
      description: 'Hands-on workshop on building AI agents and LLM applications.',
      banner: null,
      eventDate: new Date(now + 14 * oneDay).toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '16:00',
      venue: 'Bangalore Tech Park',
      capacity: 100,
      ticketTiers: [
        { id: 'tier-regular', name: 'Regular', price: 499, quantity: 80 },
        { id: 'tier-premium', name: 'Premium', price: 1299, quantity: 20 },
      ],
      ticketTypes: ['Regular', 'Premium'],
      statusOverride: null,
      roles: {},
      createdAt: now - oneDay,
    },
  ];

  const passes = [];
  const registrations = [];

  events.forEach((event, eventIdx) => {
    const attendeeNames = [
      'Rishith Guptha', 'Alice Johnson', 'Bob Smith', 'Carol White',
      'David Lee', 'Eva Martinez', 'Frank Wilson', 'Grace Chen',
    ];
    const tierNames = event.ticketTiers.map((t) => t.name);
    const regCount = eventIdx === 0 ? 6 : 3;

    for (let i = 0; i < regCount; i++) {
      const tier = event.ticketTiers[i % event.ticketTiers.length];
      const regId = generateRegistrationId(
        registrations.map((r) => r.registrationId)
      );
      const passId = generatePassId(passes.map((p) => p.passId));
      const statuses = ['ACTIVE', 'ACTIVE', 'USED', 'CANCELLED'];
      const status = statuses[i % statuses.length];

      registrations.push({
        registrationId: regId,
        eventId: event.eventId,
        userId: null,
        attendeeName: attendeeNames[i] || `Attendee ${i + 1}`,
        email: `attendee${i + 1}@example.com`,
        ticketTierId: tier.id,
        ticketType: tier.name,
        ticketPrice: tier.price,
        passId,
        status: status === 'USED' ? 'USED' : 'REGISTERED',
        createdAt: now - (regCount - i) * 3600000,
      });

      passes.push({
        passId,
        registrationId: regId,
        eventId: event.eventId,
        userId: null,
        attendeeName: attendeeNames[i] || `Attendee ${i + 1}`,
        email: `attendee${i + 1}@example.com`,
        eventName: event.name,
        eventDate: event.eventDate,
        startTime: event.startTime,
        endTime: event.endTime,
        venue: event.venue,
        ticketType: tier.name,
        ticketPrice: tier.price,
        status,
        createdAt: now - (regCount - i) * 3600000,
        eventEndDateTime: `${event.eventDate}T${event.endTime}`,
      });
    }
  });

  return { events, passes, registrations };
}
