import { enUS } from 'date-fns/locale';

import { ICAL_ATTENDEE_STATUS, ICAL_METHOD } from '../../../lib/calendar/constants';
import { createInviteIcs, generateEmailBody, generateEmailSubject } from '../../../lib/calendar/mailIntegration/invite';
import { omit } from '../../../lib/helpers/object';
import { toCRLF } from '../../../lib/helpers/string';
import { RE_PREFIX } from '../../../lib/mail/messages';

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
        parameters: { tzid: 'America/New_York' },
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
    'x-pm-session-key': { value: 'mNDd2g2LlUFUwTQZwtLuN3/ci3jq1n/DKX0oIAXgHi0=' },
    'x-pm-shared-event-id': {
        value: 'bbGoXaSj-v8UdMSbebf1GkWPkEiuSYqFU7KddqOMZ8bT63uah7OO8b6WlLrqVlqUjhJ0hEY8VFDvmn2sG0biE2MBSPv-wF5DmmS8cdH8zPI=',
    },
    'x-pm-proton-reply': { value: 'true', parameters: { type: 'boolean' } },
};

describe('createInviteIcs for REQUEST method', () => {
    it('should create the correct ics with the expected X-PM fields', () => {
        const params = {
            method: ICAL_METHOD.REQUEST,
            prodId: 'Proton Calendar',
            attendeesTo: [{ value: 'mailto:name@proton.me', parameters: { partstat: ICAL_ATTENDEE_STATUS.ACCEPTED } }],
            vevent: exampleVevent,
            keepDtstamp: true,
        };
        const ics = createInviteIcs(params);
        const expected = `BEGIN:VCALENDAR
PRODID:Proton Calendar
VERSION:2.0
METHOD:REQUEST
CALSCALE:GREGORIAN
BEGIN:VEVENT
UID:test-event
DTSTAMP:20200901T120000Z
DTSTART;TZID=Europe/Zurich:20200312T083000
DTEND;TZID=America/New_York:20200312T093000
RRULE:FREQ=WEEKLY;UNTIL=20200515
LOCATION:asd
SEQUENCE:0
ATTENDEE;CN=Unknown attendee 1;PARTSTAT=ACCEPTED:emailto:name1@proton.me
ATTENDEE;CN=Unknown attendee 2;PARTSTAT=TENTATIVE:emailto:name2@example.com
ATTENDEE;CN=Unknown attendee 3;PARTSTAT=DECLINED:emailto:name3@example.com
ATTENDEE;CN=Unknown attendee 4;PARTSTAT=NEEDS-ACTION:emailto:name4@proton.m
 e
X-PM-SESSION-KEY:mNDd2g2LlUFUwTQZwtLuN3/ci3jq1n/DKX0oIAXgHi0=
X-PM-SHARED-EVENT-ID:bbGoXaSj-v8UdMSbebf1GkWPkEiuSYqFU7KddqOMZ8bT63uah7OO8b
 6WlLrqVlqUjhJ0hEY8VFDvmn2sG0biE2MBSPv-wF5DmmS8cdH8zPI=
SUMMARY:
END:VEVENT
END:VCALENDAR`;
        expect(ics).toEqual(toCRLF(expected));
    });
});

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
DTEND;TZID=America/New_York:20200312T093000
SEQUENCE:0
RRULE:FREQ=WEEKLY;UNTIL=20200515
LOCATION:asd
DTSTAMP:20200901T120000Z
X-PM-PROTON-REPLY;VALUE=BOOLEAN:TRUE
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
DTEND;TZID=America/New_York:20200312T093000
SEQUENCE:0
RRULE:FREQ=WEEKLY;UNTIL=20200515
LOCATION:asd
SUMMARY:
DTSTAMP:20200901T120000Z
X-PM-PROTON-REPLY;VALUE=BOOLEAN:TRUE
ATTENDEE;PARTSTAT=TENTATIVE:mailto:name@proton.me
END:VEVENT
END:VCALENDAR`;
        expect(ics).toEqual(toCRLF(expected));
    });

    it('should create the correct ics when there is a summary, a recurrence-id and rrule (should remove it)', () => {
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
DTEND;TZID=America/New_York:20200312T093000
SEQUENCE:0
RECURRENCE-ID:20210618T150000Z
LOCATION:asd
SUMMARY:dcf
DTSTAMP:20200901T120000Z
X-PM-PROTON-REPLY;VALUE=BOOLEAN:TRUE
ATTENDEE;PARTSTAT=DECLINED:mailto:name@proton.me
END:VEVENT
END:VCALENDAR`;
        expect(ics).toEqual(toCRLF(expected));
    });

    it('should create the correct ics when there are no X-PM fields', () => {
        const params = {
            method: ICAL_METHOD.REPLY,
            prodId: 'Proton Calendar',
            attendeesTo: [{ value: 'mailto:name@proton.me', parameters: { partstat: ICAL_ATTENDEE_STATUS.DECLINED } }],
            vevent: omit(exampleVevent, ['x-pm-shared-event-id', 'x-pm-session-key', 'x-pm-proton-reply']),
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
DTEND;TZID=America/New_York:20200312T093000
SEQUENCE:0
RRULE:FREQ=WEEKLY;UNTIL=20200515
LOCATION:asd
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
DTEND;TZID=America/New_York:20200312T093000
SEQUENCE:0
RRULE:FREQ=WEEKLY;UNTIL=20200515
LOCATION:asd
DTSTAMP:20200901T120000Z
X-PM-SHARED-EVENT-ID:bbGoXaSj-v8UdMSbebf1GkWPkEiuSYqFU7KddqOMZ8bT63uah7OO8b
 6WlLrqVlqUjhJ0hEY8VFDvmn2sG0biE2MBSPv-wF5DmmS8cdH8zPI=
ATTENDEE:mailto:attendee1@proton.me
ATTENDEE:mailto:attendee2@proton.me
ATTENDEE:mailto:attendee3@proton.me
ATTENDEE:mailto:attendee4@proton.me
END:VEVENT
END:VCALENDAR`;
        expect(ics).toEqual(toCRLF(expected));
    });
});

describe('generateEmailSubject', () => {
    it('should return the expected subject for a new invite to an all-day single-day event', () => {
        const vevent = {
            ...exampleVevent,
            dtstart: {
                value: { year: 2020, month: 10, day: 12 },
                parameters: { type: 'date' },
            },
            dtend: {
                value: { year: 2020, month: 10, day: 13 },
                parameters: { type: 'date' },
            },
        };
        const expected = 'Invitation for an event on Monday October 12th, 2020';
        expect(
            generateEmailSubject({
                vevent,
                method: ICAL_METHOD.REQUEST,
                isCreateEvent: true,
                dateFormatOptions: { locale: enUS },
            })
        ).toEqual(expected);
    });

    it('should return the expected subject for an update to an all-day multiple-day event', () => {
        const vevent = {
            ...exampleVevent,
            dtstart: {
                value: { year: 2020, month: 3, day: 22 },
                parameters: { type: 'date' },
            },
            dtend: {
                value: { year: 2020, month: 3, day: 24 },
                parameters: { type: 'date' },
            },
        };
        const expected = 'Update for an event starting on Sunday March 22nd, 2020';
        expect(
            generateEmailSubject({
                vevent,
                method: ICAL_METHOD.REQUEST,
                isCreateEvent: false,
                dateFormatOptions: { locale: enUS },
            })
        ).toEqual(expected);
    });

    it('should return the expected subject for a cancellation of a part-day event', () => {
        const expected = 'Cancellation of an event starting on Thursday March 12th, 2020 at 8:30 AM (GMT+1)';
        expect(
            generateEmailSubject({
                vevent: exampleVevent,
                method: ICAL_METHOD.CANCEL,
                isCreateEvent: false,
                dateFormatOptions: { locale: enUS },
            })
        ).toEqual(expected);
    });

    it('should return the expected subject for a reply', () => {
        const expected = `${RE_PREFIX} Invitation for an event starting on Sunday March 22nd, 2020`;
        const expectedSingleFullDay = `${RE_PREFIX} Invitation for an event on Sunday March 22nd, 2020`;
        expect(
            generateEmailSubject({
                vevent: {
                    ...exampleVevent,
                    dtstart: {
                        value: { year: 2020, month: 3, day: 22 },
                        parameters: { type: 'date' },
                    },
                    dtend: {
                        value: { year: 2020, month: 3, day: 24 },
                        parameters: { type: 'date' },
                    },
                },
                method: ICAL_METHOD.REPLY,
                isCreateEvent: false,
                dateFormatOptions: { locale: enUS },
            })
        ).toEqual(expected);
        expect(
            generateEmailSubject({
                vevent: {
                    ...exampleVevent,
                    dtstart: {
                        value: { year: 2020, month: 3, day: 22 },
                        parameters: { type: 'date' },
                    },
                    dtend: {
                        value: { year: 2020, month: 3, day: 23 },
                        parameters: { type: 'date' },
                    },
                },
                method: ICAL_METHOD.REPLY,
                isCreateEvent: false,
                dateFormatOptions: { locale: enUS },
            })
        ).toEqual(expectedSingleFullDay);
    });
});

describe('generateEmailBody', () => {
    it('should return the expected body for a new invite to an all-day single-day event with no description', () => {
        const vevent = {
            ...exampleVevent,
            dtstart: {
                value: { year: 2020, month: 10, day: 12 },
                parameters: { type: 'date' },
            },
            dtend: {
                value: { year: 2020, month: 10, day: 13 },
                parameters: { type: 'date' },
            },
        };
        const expected = `You are invited to (no title)
When: Monday October 12th, 2020 (all day)
Where: asd`;
        expect(
            generateEmailBody({
                vevent,
                method: ICAL_METHOD.REQUEST,
                isCreateEvent: true,
                options: { locale: enUS },
            })
        ).toEqual(expected);
    });

    it('should return the expected body for a new invite to an all-day single-day event with no location', () => {
        const vevent = {
            ...omit(exampleVevent, ['location', 'dtend']),
            summary: { value: 'Watch movie' },
            dtstart: {
                value: { year: 2020, month: 10, day: 12 },
                parameters: { type: 'date' },
            },
            description: { value: 'I am a good description' },
        };
        const expected = `You are invited to Watch movie
When: Monday October 12th, 2020 (all day)
Description: I am a good description`;
        expect(
            generateEmailBody({
                vevent,
                method: ICAL_METHOD.REQUEST,
                isCreateEvent: true,
                options: { locale: enUS },
            })
        ).toEqual(expected);
    });

    it('should return the expected body for an update to an to an all-day multiple-day event with no location nor description', () => {
        const vevent = {
            ...omit(exampleVevent, ['location', 'description']),
            dtstart: {
                value: { year: 2020, month: 3, day: 22 },
                parameters: { type: 'date' },
            },
            dtend: {
                value: { year: 2020, month: 3, day: 24 },
                parameters: { type: 'date' },
            },
        };
        const expected = `(no title) has been updated.
When: Sunday March 22nd, 2020 - Monday March 23rd, 2020`;
        expect(
            generateEmailBody({
                vevent,
                method: ICAL_METHOD.REQUEST,
                isCreateEvent: false,
                options: { locale: enUS },
            })
        ).toEqual(expected);
    });

    it('should return the expected body for an update to an to an all-day multiple-day event with both location and description', () => {
        const vevent = {
            ...exampleVevent,
            dtstart: {
                value: { year: 2020, month: 3, day: 22 },
                parameters: { type: 'date' },
            },
            dtend: {
                value: { year: 2020, month: 3, day: 24 },
                parameters: { type: 'date' },
            },
            summary: { value: 'Watch movie' },
            description: { value: 'I am a good description' },
        };
        const expected = `Watch movie has been updated.
When: Sunday March 22nd, 2020 - Monday March 23rd, 2020
Where: asd
Description: I am a good description`;
        expect(
            generateEmailBody({
                vevent,
                method: ICAL_METHOD.REQUEST,
                isCreateEvent: false,
                options: { locale: enUS },
            })
        ).toEqual(expected);
    });

    it('should return the expected body for an update to an to a part-day event with both location and description', () => {
        const vevent = {
            ...exampleVevent,
            summary: { value: 'Watch movie' },
            description: { value: 'I am a good description' },
        };
        const expected = `Watch movie has been updated.
When: Thursday March 12th, 2020 at 8:30 AM (GMT+1) - Thursday March 12th, 2020 at 9:30 AM (GMT-4)
Where: asd
Description: I am a good description`;
        expect(
            generateEmailBody({
                vevent,
                method: ICAL_METHOD.REQUEST,
                isCreateEvent: false,
                options: { locale: enUS },
            })
        ).toEqual(expected);
    });

    it('should return the expected body for a cancellation of a part-day event with both location and description', () => {
        const expected = '(no title) has been canceled.';
        expect(
            generateEmailBody({
                vevent: exampleVevent,
                method: ICAL_METHOD.CANCEL,
                isCreateEvent: false,
                options: { locale: enUS },
            })
        ).toEqual(expected);
    });

    it('should return the expected body for a reply', () => {
        const emailAddress = 'andy@pm.me';
        const expected = `${emailAddress} has declined your invitation to (no title)`;
        expect(
            generateEmailBody({
                vevent: exampleVevent,
                method: ICAL_METHOD.REPLY,
                isCreateEvent: false,
                options: { locale: enUS },
                emailAddress,
                partstat: ICAL_ATTENDEE_STATUS.DECLINED,
            })
        ).toEqual(expected);
    });

    it('should throw if no partstat is passed for a reply', () => {
        const emailAddress = 'andy@pm.me';
        expect(() =>
            generateEmailBody({
                vevent: exampleVevent,
                method: ICAL_METHOD.REPLY,
                isCreateEvent: false,
                options: { locale: enUS },
                emailAddress,
            })
        ).toThrow();
    });

    it('should throw if an invalid partstat is passed for a reply', () => {
        const emailAddress = 'andy@pm.me';
        expect(() =>
            generateEmailBody({
                vevent: exampleVevent,
                method: ICAL_METHOD.REPLY,
                isCreateEvent: false,
                options: { locale: enUS },
                emailAddress,
                partstat: ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
            })
        ).toThrow();
    });
});
