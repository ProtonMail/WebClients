import { parse } from 'proton-shared/lib/calendar/vcal';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { validateEvent } from '../../src/app/helpers/import';

describe('validateEvent', () => {
    test('should catch events with start time before 1970', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=America/New_York:19690312T083000
DTEND;TZID=America/New_York:19690312T093000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(validateEvent(event)).toMatchObject({
            error: 'Start time out of bounds'
        });
    });

    test('should catch events with start time after 2038', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;VALUE=DATE:20380101
DTEND;VALUE=DATE:20380102
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(validateEvent(event)).toMatchObject({
            error: 'Start time out of bounds'
        });
    });

    test('should catch events with start and end time after 2038 and take timezones into account', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=America/New_York:20371231T203000
DTEND;TZID=America/New_York:20380101T003000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(validateEvent(event)).toMatchObject({
            error: 'Start time out of bounds'
        });
    });

    test('should catch events with negative duration', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=America/New_York:20020312T083000
DTEND;TZID=America/New_York:20010312T083000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(validateEvent(event)).toMatchObject({
            error: 'Negative duration'
        });
    });

    test('should catch notifications out of bounds', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=America/New_York:19990312T083000
DTEND;TZID=America/New_York:19990312T093000
BEGIN:VALARM
TRIGGER:-PT10000M
END:VALARM
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(validateEvent(event)).toMatchObject({
            error: 'Notification out of bounds'
        });
    });

    test('should support Outlook timezones', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=China Standard Time:20021231T203000
DTEND;TZID=W. Europe Standard Time:20030101T003000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(validateEvent(event)).toMatchObject({ event });
    });

    test('should not support Chamorro timezone', () => {
        const vevent = `BEGIN:VEVENT
DTSTAMP:19980309T231000Z
UID:test-event
DTSTART;TZID=Chamorro Standard Time:20021231T203000
DTEND;TZID=Chamorro Standard Time:20030101T003000
LOCATION:1CP Conference Room 4350
END:VEVENT`;
        const event = parse(vevent) as VcalVeventComponent;
        expect(validateEvent(event)).toMatchObject({
            error: 'Unsupported timezone'
        });
    });
});
