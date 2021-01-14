import { createInviteIcs } from '../../../lib/calendar/integration/invite';
import { ICAL_ATTENDEE_STATUS, ICAL_METHOD } from '../../../lib/calendar/constants';
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
    rrule: { value: { freq: 'WEEKLY', until: { year: 2020, month: 5, day: 15 } } },
    location: { value: 'asd' },
    sequence: { value: 0 },
    attendee: [
        {
            value: 'emailto:name1@proton.me',
            parameters: { cn: 'Unknown attendee 1', partstat: ICAL_ATTENDEE_STATUS.ACCEPTED },
        },
        {
            value: 'emailto:name2@example.com',
            parameters: { cn: 'Unknown attendee 2', partstat: ICAL_ATTENDEE_STATUS.TENTATIVE },
        },
        {
            value: 'emailto:name3@example.com',
            parameters: { cn: 'Unknown attendee 3', partstat: ICAL_ATTENDEE_STATUS.DECLINED },
        },
        {
            value: 'emailto:name4@proton.me',
            parameters: { cn: 'Unknown attendee 4', partstat: ICAL_ATTENDEE_STATUS.NEEDS_ACTION },
        },
    ],
};

describe('createInviteIcs for REPLY method', () => {
    it('should create the correct ics when there is no summary', () => {
        const params = {
            method: ICAL_METHOD.REPLY,
            prodId: 'Proton Calendar',
            attendeesTo: [{ value: 'mailto:name@proton.me', parameters: { partstat: ICAL_ATTENDEE_STATUS.ACCEPTED } }],
            vevent: exampleVevent,
            keepDtstamp: true,
        };
        const ics = createInviteIcs(params);
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
RRULE:FREQ=WEEKLY;UNTIL=20200515
LOCATION:asd
DTSTAMP:20200901T120000Z
ATTENDEE;PARTSTAT=ACCEPTED:mailto:name@proton.me
END:VEVENT
END:VCALENDAR`;
        expect(ics).toEqual(toCRLF(expected));
    });

    it('should create the correct ics when there is an empty summary', () => {
        const params = {
            method: ICAL_METHOD.REPLY,
            prodId: 'Proton Calendar',
            attendeesTo: [{ value: 'mailto:name@proton.me', parameters: { partstat: ICAL_ATTENDEE_STATUS.TENTATIVE } }],
            vevent: {
                ...exampleVevent,
                summary: { value: '' },
            },
            keepDtstamp: true,
        };
        const ics = createInviteIcs(params);
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
RRULE:FREQ=WEEKLY;UNTIL=20200515
LOCATION:asd
SUMMARY:
DTSTAMP:20200901T120000Z
ATTENDEE;PARTSTAT=TENTATIVE:mailto:name@proton.me
END:VEVENT
END:VCALENDAR`;
        expect(ics).toEqual(toCRLF(expected));
    });

    it('should create the correct ics when there is a summary and a recurrence-id', () => {
        const params = {
            method: ICAL_METHOD.REPLY,
            prodId: 'Proton Calendar',
            attendeesTo: [{ value: 'mailto:name@proton.me', parameters: { partstat: ICAL_ATTENDEE_STATUS.DECLINED } }],
            vevent: {
                ...exampleVevent,
                'recurrence-id': {
                    value: { year: 2021, month: 6, day: 18, hours: 15, minutes: 0, seconds: 0, isUTC: true },
                },
                summary: { value: 'dcf' },
            },
            keepDtstamp: true,
        };
        const ics = createInviteIcs(params);
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
RRULE:FREQ=WEEKLY;UNTIL=20200515
LOCATION:asd
SUMMARY:dcf
DTSTAMP:20200901T120000Z
ATTENDEE;PARTSTAT=DECLINED:mailto:name@proton.me
END:VEVENT
END:VCALENDAR`;
        expect(ics).toEqual(toCRLF(expected));
    });
});

describe('createInviteIcs for CANCEL method', () => {
    it('should create the correct ics', () => {
        const params = {
            method: ICAL_METHOD.CANCEL,
            prodId: 'Proton Calendar',
            attendeesTo: [
                { value: 'mailto:attendee1@proton.me', parameters: { partstat: ICAL_ATTENDEE_STATUS.ACCEPTED } },
                { value: 'mailto:attendee2@proton.me', parameters: { partstat: ICAL_ATTENDEE_STATUS.TENTATIVE } },
                { value: 'mailto:attendee3@proton.me', parameters: { partstat: ICAL_ATTENDEE_STATUS.DECLINED } },
                { value: 'mailto:attendee4@proton.me', parameters: { partstat: ICAL_ATTENDEE_STATUS.NEEDS_ACTION } },
            ],
            vevent: exampleVevent,
            keepDtstamp: true,
        };
        const ics = createInviteIcs(params);
        const expected = `BEGIN:VCALENDAR
PRODID:Proton Calendar
VERSION:2.0
METHOD:CANCEL
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:test-event
DTSTART;TZID=Europe/Zurich:20200312T083000
DTEND;TZID=Europe/Zurich:20200312T093000
SEQUENCE:0
RRULE:FREQ=WEEKLY;UNTIL=20200515
LOCATION:asd
DTSTAMP:20200901T120000Z
ATTENDEE:mailto:attendee1@proton.me
ATTENDEE:mailto:attendee2@proton.me
ATTENDEE:mailto:attendee3@proton.me
ATTENDEE:mailto:attendee4@proton.me
END:VEVENT
END:VCALENDAR`;
        expect(ics).toEqual(toCRLF(expected));
    });
});
