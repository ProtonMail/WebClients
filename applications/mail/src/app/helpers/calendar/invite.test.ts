import { ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import {
    EVENT_INVITATION_ERROR_TYPE,
    EventInvitationError,
} from '@proton/shared/lib/calendar/icsSurgery/EventInvitationError';
import { getIsRruleSupported } from '@proton/shared/lib/calendar/rrule';
import { parse } from '@proton/shared/lib/calendar/vcal';
import { getIsTimezoneComponent } from '@proton/shared/lib/calendar/vcalHelper';
import { VcalVcalendar, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { RequireSome } from '@proton/shared/lib/interfaces/utils';
import { getSupportedEventInvitation, parseVcalendar } from './invite';

describe('getIsRruleSupported for invitations', () => {
    test('should accept events with daily recurring rules valid for invitations', () => {
        const vevents = [
            `BEGIN:VEVENT\r\nRRULE:FREQ=DAILY;UNTIL=20200330T150000Z;INTERVAL=100;BYMONTH=3\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=DAILY;INTERVAL=2;BYSECOND=30;BYMINUTE=5,10,15;BYHOUR=10\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=DAILY;INTERVAL=2;BYWEEKNO=13;COUNT=499;WKST=TH\r\nEND:VEVENT`,
        ];
        const rrules = vevents.map((vevent) => {
            const parsedVevent = parse(vevent) as RequireSome<VcalVeventComponent, 'rrule'>;
            return parsedVevent.rrule.value;
        });
        expect(rrules.map((rrule) => getIsRruleSupported(rrule, true))).toEqual(vevents.map(() => true));
    });

    test('should refuse events with invalid daily recurring rules', () => {
        const vevents = [
            `BEGIN:VEVENT\r\nRRULE:FREQ=DAILY;COUNT=500\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=DAILY;INTERVAL=1000;BYMONTHDAY=11,22\r\nEND:VEVENT`,
        ];
        const rrules = vevents.map((vevent) => {
            const parsedVevent = parse(vevent) as RequireSome<VcalVeventComponent, 'rrule'>;
            return parsedVevent.rrule.value;
        });
        expect(rrules.map((rrule) => getIsRruleSupported(rrule, true))).toEqual(vevents.map(() => false));
    });

    test('should accept events with yearly recurring rules valid for invitations', () => {
        const vevents = [
            `BEGIN:VEVENT\r\nRRULE:FREQ=YEARLY;UNTIL=20200330T150000Z;INTERVAL=1;BYDAY=MO,SU,TH;BYMONTHDAY=30,31;BYMONTH=3\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=YEARLY;INTERVAL=2;BYSECOND=30;BYHOUR=10;BYMONTH=5\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=YEARLY;INTERVAL=2;BYMONTH=3;BYMONTHDAY=17,22;COUNT=499\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=YEARLY;INTERVAL=1;BYDAY=2TU;BYMONTH=7\r\nEND:VEVENT`,
        ];
        const rrules = vevents.map((vevent) => {
            const parsedVevent = parse(vevent) as RequireSome<VcalVeventComponent, 'rrule'>;
            return parsedVevent.rrule.value;
        });
        expect(rrules.map((rrule) => getIsRruleSupported(rrule, true))).toEqual(vevents.map(() => true));
    });

    test('should refuse events with invalid yearly recurring rules', () => {
        const vevents = [
            `BEGIN:VEVENT\r\nRRULE:FREQ=YEARLY;COUNT=500\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=YEARLY;INTERVAL=100;BYMONTHDAY=11,22\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=YEARLY;BYMONTHDAY=11\r\nEND:VEVENT`,
        ];
        const rrules = vevents.map((vevent) => {
            const parsedVevent = parse(vevent) as RequireSome<VcalVeventComponent, 'rrule'>;
            return parsedVevent.rrule.value;
        });
        expect(rrules.map((rrule) => getIsRruleSupported(rrule, true))).toEqual(vevents.map(() => false));
    });
});

describe('getSupportedEvent for invitations', () => {
    test('should not import alarms for invites and keep recurrence id', async () => {
        const invitation = `BEGIN:VCALENDAR
CALSCALE:GREGORIAN
VERSION:2.0
METHOD:REQUEST
PRODID:-//Apple Inc.//Mac OS X 10.13.6//EN
BEGIN:VTIMEZONE
TZID:/Europe/Vilnius
BEGIN:DAYLIGHT
TZOFFSETFROM:+0200
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
DTSTART:20030330T030000
TZNAME:EEST
TZOFFSETTO:+0300
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0300
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
DTSTART:20031026T040000
TZNAME:EET
TZOFFSETTO:+0200
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
ATTENDEE;CUTYPE=INDIVIDUAL;EMAIL="testme@pm.me";PARTSTAT=NEED
 S-ACTION;RSVP=TRUE:mailto:testme@pm.me
ATTENDEE;CN="testKrt";CUTYPE=INDIVIDUAL;EMAIL="aGmailOne@gmail.co
 m";PARTSTAT=ACCEPTED;ROLE=CHAIR:mailto:aGmailOne@gmail.com
TRANSP:OPAQUE
UID:BA3017ED-889A-4BCB-B9CB-11CE30586021
DTSTAMP:20200821T081914Z
SEQUENCE:1
CREATED:20200821T081842Z
DTSTART;TZID=Europe/Vilnius:20200915T090000
DTEND;TZID=Europe/Vilnius:20200915T100000
TRANSP:OPAQUE
ORGANIZER;CN="testKrt":mailto:aGmailOne@gmail.com
UID:BA3017ED-889A-4BCB-B9CB-11CE30586021
SUMMARY:Yearly single edit
RECURRENCE-ID;TZID=Europe/Vilnius:20220915T090000
BEGIN:VALARM
TRIGGER:-PT15H
ACTION:DISPLAY
END:VALARM
BEGIN:VALARM
TRIGGER:-PT1W2D
ACTION:EMAIL
END:VALARM
END:VEVENT
END:VCALENDAR`;
        const parsedInvitation = parseVcalendar(invitation) as VcalVcalendar;
        const message = { Time: Math.round(Date.now() / 1000) } as Message;
        expect(
            await getSupportedEventInvitation({
                vcalComponent: parsedInvitation,
                message,
                icsBinaryString: invitation,
                icsFileName: 'test.ics',
            })
        ).toMatchObject({
            method: 'REQUEST',
            vevent: {
                component: 'vevent',
                uid: { value: 'BA3017ED-889A-4BCB-B9CB-11CE30586021' },
                dtstamp: {
                    value: { year: 2020, month: 8, day: 21, hours: 8, minutes: 19, seconds: 14, isUTC: true },
                },
                dtstart: {
                    value: { year: 2020, month: 9, day: 15, hours: 9, minutes: 0, seconds: 0, isUTC: false },
                    parameters: { tzid: 'Europe/Vilnius' },
                },
                dtend: {
                    value: { year: 2020, month: 9, day: 15, hours: 10, minutes: 0, seconds: 0, isUTC: false },
                    parameters: { tzid: 'Europe/Vilnius' },
                },
                'recurrence-id': {
                    value: { year: 2022, month: 9, day: 15, hours: 9, minutes: 0, seconds: 0, isUTC: false },
                    parameters: { tzid: 'Europe/Vilnius' },
                },
                summary: { value: 'Yearly single edit' },
                sequence: { value: 1 },
            },
            vtimezone: parsedInvitation.components?.find((component) => getIsTimezoneComponent(component)),
            originalVcalInvitation: parsedInvitation,
            originalUniqueIdentifier: 'BA3017ED-889A-4BCB-B9CB-11CE30586021',
            hasMultipleVevents: false,
            fileName: 'test.ics',
        });
    });

    test('should refuse invitations with inconsistent custom yearly recurrence rules', async () => {
        const invitation = `BEGIN:VCALENDAR
CALSCALE:GREGORIAN
VERSION:2.0
METHOD:REQUEST
PRODID:-//Apple Inc.//Mac OS X 10.13.6//EN
BEGIN:VTIMEZONE
TZID:Europe/Vilnius
BEGIN:DAYLIGHT
TZOFFSETFROM:+0200
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
DTSTART:20030330T030000
TZNAME:EEST
TZOFFSETTO:+0300
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0300
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
DTSTART:20031026T040000
TZNAME:EET
TZOFFSETTO:+0200
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
ATTENDEE;CUTYPE=INDIVIDUAL;EMAIL="testme@pm.me";PARTSTAT=NEED
 S-ACTION;RSVP=TRUE:mailto:testme@pm.me
ATTENDEE;CN="testKrt";CUTYPE=INDIVIDUAL;EMAIL="aGmailOne@gmail.co
 m";PARTSTAT=ACCEPTED;ROLE=CHAIR:mailto:aGmailOne@gmail.com
DTEND;TZID=Europe/Vilnius:20200915T100000
TRANSP:OPAQUE
ORGANIZER;CN="testKrt":mailto:aGmailOne@gmail.com
UID:BA3017ED-889A-4BCB-B9CB-11CE30586021
DTSTAMP:20200821T081914Z
SEQUENCE:1
SUMMARY:Yearly custom 2
DTSTART;TZID=Europe/Vilnius:20200915T090000
X-APPLE-TRAVEL-ADVISORY-BEHAVIOR:AUTOMATIC
CREATED:20200821T081842Z
RRULE:FREQ=YEARLY;INTERVAL=1;BYMONTH=9;BYDAY=1TU
END:VEVENT
END:VCALENDAR`;
        const parsedInvitation = parseVcalendar(invitation) as VcalVcalendar;
        const message = { Time: Math.round(Date.now() / 1000) } as Message;
        await expect(
            getSupportedEventInvitation({
                vcalComponent: parsedInvitation,
                message,
                icsBinaryString: invitation,
                icsFileName: 'test.ics',
            })
        ).rejects.toMatchObject(
            new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID, { method: ICAL_METHOD.REQUEST })
        );
    });

    test('should refuse invitations with non-yearly recurrence rules that contain a byyearday', async () => {
        const invitation = `BEGIN:VCALENDAR
CALSCALE:GREGORIAN
VERSION:2.0
METHOD:REQUEST
BEGIN:VEVENT
ATTENDEE;CUTYPE=INDIVIDUAL;EMAIL="testme@pm.me";PARTSTAT=NEED
 S-ACTION;RSVP=TRUE:mailto:testme@pm.me
ATTENDEE;CN="testKrt";CUTYPE=INDIVIDUAL;EMAIL="aGmailOne@gmail.co
 m";PARTSTAT=ACCEPTED;ROLE=CHAIR:mailto:aGmailOne@gmail.com
DTEND;TZID=Europe/Vilnius:20200915T100000
ORGANIZER;CN="testKrt":mailto:aGmailOne@gmail.com
UID:BA3017ED-889A-4BCB-B9CB-11CE30586021
DTSTAMP:20200121T081914Z
SEQUENCE:1
SUMMARY:Non-yearly with byyearday
DTSTART;TZID=Europe/Vilnius:20200915T090000
X-APPLE-TRAVEL-ADVISORY-BEHAVIOR:AUTOMATIC
CREATED:20200821T081842Z
RRULE:FREQ=MONTHLY;INTERVAL=1;BYYEARDAY=21
END:VEVENT
END:VCALENDAR`;
        const parsedInvitation = parseVcalendar(invitation) as VcalVcalendar;
        const message = { Time: Math.round(Date.now() / 1000) } as Message;
        await expect(
            getSupportedEventInvitation({
                vcalComponent: parsedInvitation,
                message,
                icsBinaryString: invitation,
                icsFileName: 'test.ics',
            })
        ).rejects.toMatchObject(
            new EventInvitationError(EVENT_INVITATION_ERROR_TYPE.INVITATION_INVALID, { method: ICAL_METHOD.REQUEST })
        );
    });

    test('should generate a hash UID for invitations with no method and drop alarms and recurrence id', async () => {
        const invitation = `BEGIN:VCALENDAR
CALSCALE:GREGORIAN
VERSION:2.0
PRODID:-//Apple Inc.//Mac OS X 10.13.6//EN
BEGIN:VEVENT
UID:test-event
DTSTAMP:19980309T231000Z
DTSTART;TZID=/mozilla.org/20050126_1/Europe/Brussels:20021231T203000
DTEND;TZID=/mozilla.org/20050126_1/Europe/Brussels:20030101T003000
RECURRENCE-ID;TZID=Europe/Brussels:20121231T203000
LOCATION:1CP Conference Room 4350
ATTENDEE;CUTYPE=INDIVIDUAL;EMAIL="testme@pm.me";PARTSTAT=NEED
 S-ACTION;RSVP=TRUE:mailto:testme@pm.me
ATTENDEE;CN="testKrt";CUTYPE=INDIVIDUAL;EMAIL="aGmailOne@gmail.co
 m";PARTSTAT=ACCEPTED;ROLE=CHAIR:mailto:aGmailOne@gmail.com
TRANSP:OPAQUE
ORGANIZER;CN="testKrt":mailto:aGmailOne@gmail.com
BEGIN:VALARM
TRIGGER:-PT15H
ACTION:DISPLAY
END:VALARM
BEGIN:VALARM
TRIGGER:-PT1W2D
ACTION:EMAIL
END:VALARM
END:VEVENT
END:VCALENDAR`;
        const parsedInvitation = parseVcalendar(invitation) as VcalVcalendar;
        const message = { Time: Math.round(Date.now() / 1000) } as Message;
        expect(
            await getSupportedEventInvitation({
                vcalComponent: parsedInvitation,
                message,
                icsBinaryString: invitation,
                icsFileName: 'test.ics',
            })
        ).toMatchObject({
            method: 'PUBLISH',
            vevent: {
                component: 'vevent',
                uid: { value: 'sha1-uid-cba317c4bb79e20bdca567bf6dc80dfce145712b-original-uid-test-event' },
                dtstamp: {
                    value: { year: 1998, month: 3, day: 9, hours: 23, minutes: 10, seconds: 0, isUTC: true },
                },
                dtstart: {
                    value: { year: 2002, month: 12, day: 31, hours: 20, minutes: 30, seconds: 0, isUTC: false },
                    parameters: { tzid: 'Europe/Brussels' },
                },
                dtend: {
                    value: { year: 2003, month: 1, day: 1, hours: 0, minutes: 30, seconds: 0, isUTC: false },
                    parameters: { tzid: 'Europe/Brussels' },
                },
                location: { value: '1CP Conference Room 4350' },
                sequence: { value: 0 },
            },
            originalVcalInvitation: parsedInvitation,
            originalUniqueIdentifier: 'test-event',
            hasMultipleVevents: false,
            fileName: 'test.ics',
        });
    });

    test('should not throw without version', async () => {
        const invitation = `BEGIN:VCALENDAR
CALSCALE:GREGORIAN
PRODID:-//Apple Inc.//Mac OS X 10.13.6//EN
BEGIN:VEVENT
UID:test-event
DTSTAMP:19980309T231000Z
DTSTART;TZID=Europe/Brussels:20021231T203000
END:VEVENT
END:VCALENDAR`;
        const parsedInvitation = parseVcalendar(invitation) as VcalVcalendar;
        const message = { Time: Math.round(Date.now() / 1000) } as Message;

        void expect(() =>
            getSupportedEventInvitation({
                vcalComponent: parsedInvitation,
                message,
                icsBinaryString: invitation,
                icsFileName: 'test.ics',
            })
        ).not.toThrow();
    });
});

describe('getSupportedEventInvitation should guess a timezone to localize floating dates', () => {
    const generateVcalSetup = (xWrTimezone = '', vtimezonesTzids: string[] = []) => {
        const xWrTimezoneString = xWrTimezone ? `X-WR-TIMEZONE:${xWrTimezone}` : '';
        const vtimezonesString = vtimezonesTzids
            .map(
                (tzid) => `BEGIN:VTIMEZONE
TZID:${tzid}
END:VTIMEZONE`
            )
            .join('\n');
        const vcal = `BEGIN:VCALENDAR
CALSCALE:GREGORIAN
VERSION:2.0
METHOD:REQUEST
${xWrTimezoneString}
${vtimezonesString}
BEGIN:VEVENT
ATTENDEE;CUTYPE=INDIVIDUAL;EMAIL="testme@pm.me";PARTSTAT=NEED
 S-ACTION;RSVP=TRUE:mailto:testme@pm.me
ATTENDEE;CN="testKrt";CUTYPE=INDIVIDUAL;EMAIL="aGmailOne@gmail.co
 m";PARTSTAT=ACCEPTED;ROLE=CHAIR:mailto:aGmailOne@gmail.com
DTSTART:20200915T090000
DTEND:20200915T100000
ORGANIZER;CN="testKrt":mailto:aGmailOne@gmail.com
UID:BA3017ED-889A-4BCB-B9CB-11CE30586021
DTSTAMP:20200821T081914Z
SEQUENCE:1
SUMMARY:Floating date-time
RRULE:FREQ=DAILY;INTERVAL=2;COUNT=5
END:VEVENT
END:VCALENDAR`;
        return {
            vcalComponent: parse(vcal) as VcalVcalendar,
            message: { Time: Math.round(Date.now() / 1000) } as Message,
            icsBinaryString: vcal,
            icsFileName: 'test.ics',
        };
    };
    const localizedVevent = (tzid: string) => ({
        component: 'vevent',
        uid: { value: 'BA3017ED-889A-4BCB-B9CB-11CE30586021' },
        dtstamp: {
            value: { year: 2020, month: 8, day: 21, hours: 8, minutes: 19, seconds: 14, isUTC: true },
        },
        dtstart: {
            value: { year: 2020, month: 9, day: 15, hours: 9, minutes: 0, seconds: 0, isUTC: false },
            parameters: { tzid },
        },
        dtend: {
            value: { year: 2020, month: 9, day: 15, hours: 10, minutes: 0, seconds: 0, isUTC: false },
            parameters: { tzid },
        },
        summary: { value: 'Floating date-time' },
        sequence: { value: 1 },
        rrule: { value: { freq: 'DAILY', interval: 2, count: 5 } },
        organizer: {
            value: 'mailto:aGmailOne@gmail.com',
            parameters: { cn: 'testKrt' },
        },
        attendee: [
            {
                value: 'mailto:testme@pm.me',
                parameters: {
                    partstat: 'NEEDS-ACTION',
                    rsvp: 'TRUE',
                    cn: 'testme@pm.me',
                },
            },
            {
                value: 'mailto:aGmailOne@gmail.com',
                parameters: {
                    partstat: 'ACCEPTED',
                    cn: 'testKrt',
                },
            },
        ],
    });

    test('when there is both x-wr-timezone and single vtimezone (use x-wr-timezone)', async () => {
        const { vevent } =
            (await getSupportedEventInvitation(generateVcalSetup('Europe/Brussels', ['America/New_York']))) || {};
        expect(vevent).toEqual(localizedVevent('Europe/Brussels'));
    });

    test('when there is a single vtimezone and no x-wr-timezone', async () => {
        const { vevent } = (await getSupportedEventInvitation(generateVcalSetup('', ['Europe/Vilnius']))) || {};
        expect(vevent).toEqual(localizedVevent('Europe/Vilnius'));
    });

    test('when there is a single vtimezone and x-wr-timezone is not supported', async () => {
        await expect(
            getSupportedEventInvitation(generateVcalSetup('Moon/Tranquility', ['Europe/Vilnius']))
        ).rejects.toThrowError('Unsupported invitation');
    });

    test('when there is no vtimezone nor x-wr-timezone (reject unsupported event)', async () => {
        await expect(getSupportedEventInvitation(generateVcalSetup())).rejects.toThrowError('Unsupported invitation');
    });

    test('when there is no x-wr-timezone and more than one vtimezone (reject unsupported event)', async () => {
        await expect(
            getSupportedEventInvitation(generateVcalSetup('', ['Europe/Vilnius', 'America/New_York']))
        ).rejects.toThrowError('Unsupported invitation');
    });
});
