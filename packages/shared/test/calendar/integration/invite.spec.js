import { createReplyIcs } from '../../../lib/calendar/integration/invite';
import { ICAL_ATTENDEE_STATUS } from '../../../lib/calendar/constants';
import { toCRLF } from '../veventHelper.spec';

const exampleVevent = {
    component: 'vevent',
    uid: { value: 'test-event' },
    dtstamp: {
        value: { year: 2020, month: 9, day: 1, hours: 12, minutes: 0, seconds: 0, isUTC: true },
    },
    dtstart: {
        value: { year: 2020, month: 3, day: 12, hours: 8, minutes: 30, seconds: 0, isUTC: false },
        parameters: { tzid: 'Europe/Zurich' },
    },
    dtend: {
        value: { year: 2020, month: 3, day: 12, hours: 9, minutes: 30, seconds: 0, isUTC: false },
        parameters: { tzid: 'Europe/Zurich' },
    },
    location: { value: 'asd' },
    sequence: { value: 0 },
};

describe('createReplyIcs()', () => {
    it('should create the correct ics when there is no summary', () => {
        const params = {
            prodId: 'Proton Calendar',
            emailTo: 'uid@proton.me',
            partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
            vevent: {
                ...exampleVevent,
                rrule: { value: { freq: 'WEEKLY', until: { year: 2020, month: 5, day: 15 } } },
            },
            keepDtstamp: true,
        };
        const ics = createReplyIcs(params);
        const expected = `BEGIN:VCALENDAR
PRODID:Proton Calendar
VERSION:2.0
METHOD:REPLY
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:test-event
DTSTART;TZID=Europe/Zurich:20200312T083000
DTEND;TZID=Europe/Zurich:20200312T093000
SEQUENCE:0
DTSTAMP:20200901T120000Z
ATTENDEE;PARTSTAT=ACCEPTED:uid@proton.me
END:VEVENT
END:VCALENDAR`;
        expect(ics).toEqual(toCRLF(expected));
    });

    it('should create the correct ics when there is an empty summary', () => {
        const params = {
            prodId: 'Proton Calendar',
            emailTo: 'uid@proton.me',
            partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
            vevent: {
                ...exampleVevent,
                summary: { value: '' },
            },
            keepDtstamp: true,
        };
        const ics = createReplyIcs(params);
        const expected = `BEGIN:VCALENDAR
PRODID:Proton Calendar
VERSION:2.0
METHOD:REPLY
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:test-event
DTSTART;TZID=Europe/Zurich:20200312T083000
DTEND;TZID=Europe/Zurich:20200312T093000
SEQUENCE:0
SUMMARY:
DTSTAMP:20200901T120000Z
ATTENDEE;PARTSTAT=ACCEPTED:uid@proton.me
END:VEVENT
END:VCALENDAR`;
        expect(ics).toEqual(toCRLF(expected));
    });

    it('should create the correct ics when there is a summary and a recurrence-id', () => {
        const params = {
            prodId: 'Proton Calendar',
            emailTo: 'uid@proton.me',
            partstat: ICAL_ATTENDEE_STATUS.ACCEPTED,
            vevent: {
                ...exampleVevent,
                'recurrence-id': {
                    value: { year: 2021, month: 6, day: 18, hours: 15, minutes: 0, seconds: 0, isUTC: true },
                },
                summary: { value: 'dcf' },
            },
            keepDtstamp: true,
        };
        const ics = createReplyIcs(params);
        const expected = `BEGIN:VCALENDAR
PRODID:Proton Calendar
VERSION:2.0
METHOD:REPLY
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:test-event
DTSTART;TZID=Europe/Zurich:20200312T083000
DTEND;TZID=Europe/Zurich:20200312T093000
SEQUENCE:0
RECURRENCE-ID:20210618T150000Z
SUMMARY:dcf
DTSTAMP:20200901T120000Z
ATTENDEE;PARTSTAT=ACCEPTED:uid@proton.me
END:VEVENT
END:VCALENDAR`;
        expect(ics).toEqual(toCRLF(expected));
    });
});
