import { generateAttendeeToken } from '@proton/shared/lib/calendar/attendees';
import { ICAL_ATTENDEE_RSVP, ICAL_ATTENDEE_STATUS, ICAL_METHOD } from '@proton/shared/lib/calendar/constants';
import { generateVeventHashUID } from '@proton/shared/lib/calendar/helper';
import type { EventInvitationError } from '@proton/shared/lib/calendar/icsSurgery/EventInvitationError';
import { EVENT_INVITATION_ERROR_TYPE } from '@proton/shared/lib/calendar/icsSurgery/errors/icsSurgeryErrorTypes';
import { getIsRruleSupported } from '@proton/shared/lib/calendar/recurrence/rrule';
import { parse } from '@proton/shared/lib/calendar/vcal';
import { getIsTimezoneComponent } from '@proton/shared/lib/calendar/vcalHelper';
import type { Recipient } from '@proton/shared/lib/interfaces';
import type { Attendee, CalendarEvent, Participant } from '@proton/shared/lib/interfaces/calendar';
import type { VcalVcalendar, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import type { RequireSome } from '@proton/shared/lib/interfaces/utils';

import type { MessageStateWithData } from 'proton-mail/store/messages/messagesTypes';

import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../test/crypto';
import type { EventInvitation } from './invite';
import { getIsPartyCrasher, getSupportedEventInvitation, parseVcalendar } from './invite';

describe('Invitations', () => {
    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

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
                    primaryTimezone: 'America/Sao_Paulo',
                    canImportEventColor: false,
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
            expect.assertions(7);
            return getSupportedEventInvitation({
                vcalComponent: parsedInvitation,
                message,
                icsBinaryString: invitation,
                icsFileName: 'test.ics',
                primaryTimezone: 'America/Sao_Paulo',
                canImportEventColor: false,
            }).catch((e: EventInvitationError) => {
                expect(e.message).toEqual('Malformed recurring event');
                expect(e.extendedType).toEqual(EVENT_INVITATION_ERROR_TYPE.RRULE_MALFORMED);
                expect(e.method).toEqual(ICAL_METHOD.REQUEST);
                expect(e.componentIdentifiers?.prodId).toEqual('-//Apple Inc.//Mac OS X 10.13.6//EN');
                expect(e.componentIdentifiers?.domain).toEqual('');
                expect(e.componentIdentifiers?.component).toEqual('vevent');
                expect(e.originalUniqueIdentifier).toEqual('BA3017ED-889A-4BCB-B9CB-11CE30586021');
            });
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
            expect.assertions(7);
            return getSupportedEventInvitation({
                vcalComponent: parsedInvitation,
                message,
                icsBinaryString: invitation,
                icsFileName: 'test.ics',
                primaryTimezone: 'America/Sao_Paulo',
                canImportEventColor: false,
            }).catch((e: EventInvitationError) => {
                expect(e.message).toEqual('Malformed recurring event');
                expect(e.extendedType).toEqual(EVENT_INVITATION_ERROR_TYPE.RRULE_MALFORMED);
                expect(e.method).toEqual(ICAL_METHOD.REQUEST);
                expect(e.componentIdentifiers?.prodId).toEqual('');
                expect(e.componentIdentifiers?.domain).toEqual('');
                expect(e.componentIdentifiers?.component).toEqual('vevent');
                expect(e.originalUniqueIdentifier).toEqual('BA3017ED-889A-4BCB-B9CB-11CE30586021');
            });
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
                    primaryTimezone: 'America/Sao_Paulo',
                    canImportEventColor: false,
                })
            ).toMatchObject({
                method: 'PUBLISH',
                vevent: {
                    component: 'vevent',
                    uid: { value: 'original-uid-test-event-sha1-uid-cba317c4bb79e20bdca567bf6dc80dfce145712b' },
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
                },
                originalVcalInvitation: parsedInvitation,
                originalUniqueIdentifier: 'test-event',
                hasMultipleVevents: false,
                fileName: 'test.ics',
            });
        });

        test('should generate a DTSTAMP from the message if no DTSTAMP was present', async () => {
            const invitation = `BEGIN:VCALENDAR
CALSCALE:GREGORIAN
VERSION:2.0
PRODID:-//Apple Inc.//Mac OS X 10.13.6//EN
BEGIN:VEVENT
UID:test-event
DTSTART;TZID=/mozilla.org/20050126_1/Europe/Brussels:20021231T203000
DTEND;TZID=/mozilla.org/20050126_1/Europe/Brussels:20030101T003000
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
            const message = { Time: Date.UTC(2022, 9, 10, 10, 0, 0) / 1000 } as Message;
            expect(
                await getSupportedEventInvitation({
                    vcalComponent: parsedInvitation,
                    message,
                    icsBinaryString: invitation,
                    icsFileName: 'test.ics',
                    primaryTimezone: 'America/Sao_Paulo',
                    canImportEventColor: false,
                })
            ).toEqual({
                method: 'PUBLISH',
                prodId: '-//Apple Inc.//Mac OS X 10.13.6//EN',
                vevent: expect.objectContaining({
                    component: 'vevent',
                    uid: { value: 'original-uid-test-event-sha1-uid-1d92b0aa7fed011b07b53161798dfeb45cf4e186' },
                    dtstamp: {
                        value: { year: 2022, month: 10, day: 10, hours: 10, minutes: 0, seconds: 0, isUTC: true },
                    },
                    dtstart: {
                        value: { year: 2002, month: 12, day: 31, hours: 20, minutes: 30, seconds: 0, isUTC: false },
                        parameters: { tzid: 'Europe/Brussels' },
                    },
                    dtend: {
                        value: { year: 2003, month: 1, day: 1, hours: 0, minutes: 30, seconds: 0, isUTC: false },
                        parameters: { tzid: 'Europe/Brussels' },
                    },
                    sequence: { value: 0 },
                }),
                originalIcsHasNoOrganizer: false,
                originalVcalInvitation: parsedInvitation,
                originalUniqueIdentifier: 'test-event',
                legacyUid: 'sha1-uid-1d92b0aa7fed011b07b53161798dfeb45cf4e186-original-uid-test-event',
                hasMultipleVevents: false,
                fileName: 'test.ics',
            });
        });

        test('should not throw without version, untrimmed calscale and duration', async () => {
            const invitation = `BEGIN:VCALENDAR
CALSCALE: Gregorian
PRODID:-//Apple Inc.//Mac OS X 10.13.6//EN
BEGIN:VEVENT
UID:test-event
DTSTAMP:19980309T231000Z
DTSTART;VALUE=DATE:20021231
DURATION:PT2D
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
                    primaryTimezone: 'America/Sao_Paulo',
                    canImportEventColor: false,
                })
            ).resolves.not.toThrow();
        });

        test('should throw for unknown calscales', async () => {
            const invitation = `BEGIN:VCALENDAR
CALSCALE:GREGORIANU
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
            expect.assertions(7);
            return getSupportedEventInvitation({
                vcalComponent: parsedInvitation,
                message,
                icsBinaryString: invitation,
                icsFileName: 'test.ics',
                primaryTimezone: 'America/Sao_Paulo',
                canImportEventColor: false,
            }).catch((e: EventInvitationError) => {
                expect(e.message).toEqual('Only the Gregorian calendar scale is allowed');
                expect(e.extendedType).toEqual(EVENT_INVITATION_ERROR_TYPE.NON_GREGORIAN);
                expect(e.method).toEqual(ICAL_METHOD.REQUEST);
                expect(e.componentIdentifiers?.prodId).toEqual('');
                expect(e.componentIdentifiers?.domain).toEqual('');
                expect(e.componentIdentifiers?.component).toEqual('vevent');
                // for errors thrown before parsing the UID, the original unique identifier is a hash
                expect(e.originalUniqueIdentifier).toEqual('sha1-uid-c03b3302b8c22a7cda1364bdfc6c9bf3b7a72ad9');
            });
        });

        test('should not throw when receiving a VTIMEZONE without TZID', async () => {
            const invitation = `BEGIN:VCALENDAR
PRODID:-//Google Inc//Google Calendar 70.9054//EN
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:REQUEST
X-WR-TIMEZONE:Pacific/Niue
BEGIN:VTIMEZONE
X-LIC-LOCATION:Pacific/Niue
BEGIN:STANDARD
TZOFFSETFROM:-1100
TZOFFSETTO:-1100
TZNAME:-11
DTSTART:19700101T000000
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
DTSTART:20220403T153000Z
DTEND:20220403T163000Z
DTSTAMP:20220307T132207Z
ORGANIZER;CN=calendarregression@gmail.com:mailto:calendarregression@gmail.c
 om
UID:0928j897bqah35i424dnvjdu3v12346465465@google.com
ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=
 TRUE;CN=calendar-user-pentest1@protonmail.com;X-NUM-GUESTS=0:mailto:calenda
 r-user-pentest1@protonmail.com
ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=
 TRUE;CN=android@protonqa.xyz;X-NUM-GUESTS=0:mailto:android@protonqa.xyz
ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;RSVP=TRUE
 ;CN=calendarregression@gmail.com;X-NUM-GUESTS=0:mailto:calendarregression@g
 mail.com
ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=
 TRUE;CN=visionary@lysenko.proton.black;X-NUM-GUESTS=0:mailto:visionary@lyse
 nko.proton.black
ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=
 TRUE;CN=pro@lysenko.proton.black;X-NUM-GUESTS=0:mailto:pro@lysenko.proton.b
 lack
ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=
 TRUE;CN=plus@lysenko.proton.black;X-NUM-GUESTS=0:mailto:plus@lysenko.proton
 .black
X-GOOGLE-CONFERENCE:https://meet.google.com/aey-yjac-rfe
X-MICROSOFT-CDO-OWNERAPPTID:-1984897430
CREATED:20220307T132206Z
DESCRIPTION:-::~:~::~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~
 :~:~:~:~:~:~:~:~::~:~::-\\nDo not edit this section of the description.\\n\\nT
 his event has a video call.\\nJoin: https://meet.google.com/aey-yjac-rfe\\n\\n
 View your event at https://calendar.google.com/calendar/event?action=VIEW&e
 id=MDkyOGo4OTdicWFoMzVpNDI0ZG52amR1M3YgcHJvQGx5c2Vua28ucHJvdG9uLmJsYWNr&tok
 =MjgjY2FsZW5kYXJyZWdyZXNzaW9uQGdtYWlsLmNvbWM0MmE4NGNmZDY5NTBlYzliNzdlY2Q1N2
 ZiNDcwYWFmNjc1YWY5NDE&ctz=Europe%2FVilnius&hl=en_GB&es=1.\\n-::~:~::~:~:~:~:
 ~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~:~::~:~::-
LAST-MODIFIED:20220307T132206Z
LOCATION:
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:Pacific / Niue (3)
TRANSP:OPAQUE
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
                    primaryTimezone: 'America/Sao_Paulo',
                    canImportEventColor: false,
                })
            ).resolves.not.toThrow();
        });

        test('should reformat break lines properly', async () => {
            const invitation = `BEGIN:VCALENDAR
PRODID:-//Google Inc//Google Calendar 70.9054//EN
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
DTSTART;VALUE=DATE:20220111
DTEND;VALUE=DATE:20220112
DTSTAMP:20210108T113223Z
ORGANIZER:mailto:orgo@protonmail.com
UID:case5544646879321797797898799
X-MICROSOFT-CDO-OWNERAPPTID:-1089749046
ATTENDEE;CN=att1@protonmail.com;CUTYPE=INDIVIDUAL;EMAIL=att1@protonmail.com;RSVP=TRUE;PARTSTAT=NEEDS-ACTION:/aMjk2MDIzMDQ4Mjk2MDI
zMIZjbeHD-pCEmJU6loV23jx6n2nXhXA9yXmtoE4a87979dmv46466/principal/
ATTENDEE;CN=att2@pm.me;CUTYPE=INDIVIDUAL;EMAIL=att2@pm.me;RSVP=TRUE;PARTSTAT=NEEDS-ACTION:/aMjk2MDIzMDQ4Mjk2MDI
zMIZjbeHD-pCEmJU6loV23jx6n2nXhXA9yXmtoE4ad7879mv67/principal/
CREATED:20210108T113222Z
DESCRIPTION:Extracting attendee
LAST-MODIFIED:20210108T113222Z
LOCATION:
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:Attendees - 6 invited apple 2
TRANSP:TRANSPARENT
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
                    primaryTimezone: 'America/Sao_Paulo',
                    canImportEventColor: false,
                })
            ).toMatchObject({
                method: 'REQUEST',
                vevent: {
                    component: 'vevent',
                    uid: { value: 'case5544646879321797797898799' },
                    dtstamp: {
                        value: { year: 2021, month: 1, day: 8, hours: 11, minutes: 32, seconds: 23, isUTC: true },
                    },
                    dtstart: {
                        value: { year: 2022, month: 1, day: 11 },
                        parameters: { type: 'date' },
                    },
                    summary: { value: 'Attendees - 6 invited apple 2' },
                    description: { value: 'Extracting attendee' },
                    sequence: { value: 0 },
                    organizer: { value: 'mailto:orgo@protonmail.com' },
                    attendee: [
                        {
                            value: 'mailto:att1@protonmail.com',
                            parameters: {
                                cn: 'att1@protonmail.com',
                                rsvp: ICAL_ATTENDEE_RSVP.TRUE,
                                partstat: ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
                            },
                        },
                        {
                            value: 'mailto:att2@pm.me',
                            parameters: {
                                cn: 'att2@pm.me',
                                rsvp: ICAL_ATTENDEE_RSVP.TRUE,
                                partstat: ICAL_ATTENDEE_STATUS.NEEDS_ACTION,
                            },
                        },
                    ],
                },
                vtimezone: parsedInvitation.components?.find((component) => getIsTimezoneComponent(component)),
                originalVcalInvitation: parsedInvitation,
                originalUniqueIdentifier: 'case5544646879321797797898799',
                hasMultipleVevents: false,
                fileName: 'test.ics',
            });
        });

        describe('should fix sequences out of bounds', () => {
            test('if they are negative', async () => {
                const invitation = `BEGIN:VCALENDAR
CALSCALE:GREGORIAN
VERSION:2.0
PRODID:-//Apple Inc.//Mac OS X 10.13.6//EN
BEGIN:VEVENT
UID:test-event
DTSTART;TZID=/mozilla.org/20050126_1/Europe/Brussels:20021231T203000
DTEND;TZID=/mozilla.org/20050126_1/Europe/Brussels:20030101T003000
SEQUENCE:-1
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
                const message = { Time: Date.UTC(2022, 9, 10, 10, 0, 0) / 1000 } as Message;
                expect(
                    await getSupportedEventInvitation({
                        vcalComponent: parsedInvitation,
                        message,
                        icsBinaryString: invitation,
                        icsFileName: 'test.ics',
                        primaryTimezone: 'America/Sao_Paulo',
                        canImportEventColor: false,
                    })
                ).toEqual(
                    expect.objectContaining({
                        vevent: expect.objectContaining({
                            sequence: { value: 0 },
                        }),
                    })
                );
            });

            test('if they are too big', async () => {
                const invitation = `BEGIN:VCALENDAR
CALSCALE:GREGORIAN
VERSION:2.0
PRODID:-//Apple Inc.//Mac OS X 10.13.6//EN
BEGIN:VEVENT
UID:test-event
DTSTART;TZID=/mozilla.org/20050126_1/Europe/Brussels:20021231T203000
DTEND;TZID=/mozilla.org/20050126_1/Europe/Brussels:20030101T003000
SEQUENCE:2205092022
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
                const message = { Time: Date.UTC(2022, 9, 10, 10, 0, 0) / 1000 } as Message;
                expect(
                    await getSupportedEventInvitation({
                        vcalComponent: parsedInvitation,
                        message,
                        icsBinaryString: invitation,
                        icsFileName: 'test.ics',
                        primaryTimezone: 'America/Sao_Paulo',
                        canImportEventColor: false,
                    })
                ).toEqual(
                    expect.objectContaining({
                        vevent: expect.objectContaining({
                            sequence: { value: 57608374 },
                        }),
                    })
                );
            });
        });
    });

    describe('getSupportedEventInvitation should guess a timezone to localize floating dates for invites', () => {
        const generateVcalSetup = ({
            method = ICAL_METHOD.REQUEST,
            prodId = 'DUMMY PRODID',
            primaryTimezone = 'Asia/Seoul',
            xWrTimezone = '',
            vtimezonesTzids = [],
        }: {
            method?: ICAL_METHOD;
            prodId?: string;
            xWrTimezone?: string;
            vtimezonesTzids?: string[];
            primaryTimezone?: string;
        }) => {
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
METHOD:${method}
PRODID:${prodId}
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
                primaryTimezone,
                canImportEventColor: false,
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
                (await getSupportedEventInvitation(
                    generateVcalSetup({
                        xWrTimezone: 'Europe/Brussels',
                        vtimezonesTzids: ['America/New_York'],
                    })
                )) || {};
            expect(vevent).toEqual(localizedVevent('Europe/Brussels'));
        });

        test('when there is a single vtimezone and no x-wr-timezone', async () => {
            const { vevent } =
                (await getSupportedEventInvitation(
                    generateVcalSetup({
                        vtimezonesTzids: ['Europe/Vilnius'],
                    })
                )) || {};
            expect(vevent).toEqual(localizedVevent('Europe/Vilnius'));
        });

        test('when there is a single vtimezone and x-wr-timezone is not supported', async () => {
            expect.assertions(7);
            return getSupportedEventInvitation(
                generateVcalSetup({
                    method: ICAL_METHOD.REPLY,
                    xWrTimezone: 'Moon/Tranquility',
                    vtimezonesTzids: ['Europe/Vilnius'],
                })
            ).catch((e: EventInvitationError) => {
                expect(e.message).toEqual('Calendar time zone not supported');
                expect(e.extendedType).toEqual(EVENT_INVITATION_ERROR_TYPE.X_WR_TIMEZONE_UNSUPPORTED);
                expect(e.method).toEqual(ICAL_METHOD.REPLY);
                expect(e.componentIdentifiers?.prodId).toEqual('DUMMY PRODID');
                expect(e.componentIdentifiers?.domain).toEqual('');
                expect(e.componentIdentifiers?.component).toEqual('vevent');
                expect(e.originalUniqueIdentifier).toEqual('BA3017ED-889A-4BCB-B9CB-11CE30586021');
            });
        });

        test('when there is no vtimezone nor x-wr-timezone (reject unsupported event)', async () => {
            expect.assertions(7);
            return getSupportedEventInvitation(
                generateVcalSetup({
                    method: ICAL_METHOD.CANCEL,
                })
            ).catch((e: EventInvitationError) => {
                expect(e.message).toEqual('Floating times not supported');
                expect(e.extendedType).toEqual(EVENT_INVITATION_ERROR_TYPE.UNEXPECTED_FLOATING_TIME);
                expect(e.method).toEqual(ICAL_METHOD.CANCEL);
                expect(e.componentIdentifiers?.prodId).toEqual('DUMMY PRODID');
                expect(e.componentIdentifiers?.domain).toEqual('');
                expect(e.componentIdentifiers?.component).toEqual('vevent');
                expect(e.originalUniqueIdentifier).toEqual('BA3017ED-889A-4BCB-B9CB-11CE30586021');
            });
        });

        test('when there is no x-wr-timezone and more than one vtimezone (reject unsupported event)', async () => {
            expect.assertions(7);
            return getSupportedEventInvitation(
                generateVcalSetup({
                    method: ICAL_METHOD.COUNTER,
                    vtimezonesTzids: ['Europe/Vilnius', 'America/New_York'],
                })
            ).catch((e: EventInvitationError) => {
                expect(e.message).toEqual('Floating times not supported');
                expect(e.extendedType).toEqual(EVENT_INVITATION_ERROR_TYPE.UNEXPECTED_FLOATING_TIME);
                expect(e.method).toEqual(ICAL_METHOD.COUNTER);
                expect(e.componentIdentifiers?.prodId).toEqual('DUMMY PRODID');
                expect(e.componentIdentifiers?.domain).toEqual('');
                expect(e.componentIdentifiers?.component).toEqual('vevent');
                expect(e.originalUniqueIdentifier).toEqual('BA3017ED-889A-4BCB-B9CB-11CE30586021');
            });
        });
    });

    describe('getSupportedEventInvitation should guess a timezone to localize floating dates for invites for import PUBLISH', () => {
        const generateVcalSetup = async ({
            method = ICAL_METHOD.PUBLISH,
            prodId = 'DUMMY PRODID',
            xWrTimezone = '',
            vtimezonesTzids = [],
            primaryTimezone,
            uid = 'BA3017ED-889A-4BCB-B9CB-11CE30586021',
        }: {
            method?: ICAL_METHOD;
            prodId?: string;
            xWrTimezone?: string;
            vtimezonesTzids?: string[];
            primaryTimezone: string;
            uid?: string;
        }) => {
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
PRODID:${prodId}
METHOD:${method}
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
UID:${uid}
DTSTAMP:20200821T081914Z
SEQUENCE:1
SUMMARY:Floating date-time
RRULE:FREQ=DAILY;INTERVAL=2;COUNT=5
END:VEVENT
END:VCALENDAR`;
            const parsedVcal = parse(vcal) as VcalVcalendar;

            return {
                vcalComponent: parsedVcal,
                message: { Time: Math.round(Date.now() / 1000) } as Message,
                icsBinaryString: vcal,
                icsFileName: 'test.ics',
                primaryTimezone,
                hashUid: await generateVeventHashUID(vcal, uid),
                canImportEventColor: false,
            };
        };
        const localizedVevent = (tzid: string, hashUid: string) => ({
            component: 'vevent',
            uid: { value: hashUid },
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
        });

        test('when there is both x-wr-timezone and single vtimezone (use x-wr-timezone)', async () => {
            const setup = await generateVcalSetup({
                primaryTimezone: 'Asia/Seoul',
                xWrTimezone: 'Europe/Brussels',
                vtimezonesTzids: ['America/New_York'],
            });
            const { vevent } = (await getSupportedEventInvitation(setup)) || {};
            expect(vevent).toEqual(localizedVevent('Europe/Brussels', setup.hashUid));
        });

        test('when there is a single vtimezone and no x-wr-timezone', async () => {
            const setup = await generateVcalSetup({
                primaryTimezone: 'Asia/Seoul',
                vtimezonesTzids: ['Europe/Vilnius'],
            });
            const { vevent } = (await getSupportedEventInvitation(setup)) || {};
            expect(vevent).toEqual(localizedVevent('Europe/Vilnius', setup.hashUid));
        });

        test('when there is a single vtimezone and x-wr-timezone is not supported', async () => {
            expect.assertions(7);
            return getSupportedEventInvitation(
                await generateVcalSetup({
                    primaryTimezone: 'Asia/Seoul',
                    xWrTimezone: 'Moon/Tranquility',
                    vtimezonesTzids: ['Europe/Vilnius'],
                })
            ).catch((e: EventInvitationError) => {
                expect(e.message).toEqual('Calendar time zone not supported');
                expect(e.extendedType).toEqual(EVENT_INVITATION_ERROR_TYPE.X_WR_TIMEZONE_UNSUPPORTED);
                expect(e.method).toEqual(ICAL_METHOD.PUBLISH);
                expect(e.componentIdentifiers?.prodId).toEqual('DUMMY PRODID');
                expect(e.componentIdentifiers?.domain).toEqual('');
                expect(e.componentIdentifiers?.component).toEqual('vevent');
                expect(e.originalUniqueIdentifier).toEqual('BA3017ED-889A-4BCB-B9CB-11CE30586021');
            });
        });

        test('when there is no vtimezone nor x-wr-timezone (use primary time zone)', async () => {
            const setup = await generateVcalSetup({
                primaryTimezone: 'Asia/Seoul',
            });
            const { vevent } = (await getSupportedEventInvitation(setup)) || {};
            expect(vevent).toEqual(localizedVevent('Asia/Seoul', setup.hashUid));
        });

        test('when there is no x-wr-timezone and more than one vtimezone (use primary time zone)', async () => {
            const setup = await generateVcalSetup({
                primaryTimezone: 'Asia/Seoul',
                vtimezonesTzids: ['Europe/Vilnius', 'America/New_York'],
            });
            const { vevent } = (await getSupportedEventInvitation(setup)) || {};
            expect(vevent).toEqual(localizedVevent('Asia/Seoul', setup.hashUid));
        });
    });

    describe('getSupportedEventInvitation should throw', () => {
        const generateVcalSetup = async ({
            method = ICAL_METHOD.REQUEST,
            prodId = 'DUMMY PRODID',
            calscale = 'GREGORIAN',
            primaryTimezone,
            uid,
        }: {
            method?: string;
            prodId?: string;
            calscale?: string;
            xWrTimezone?: string;
            vtimezonesTzids?: string[];
            primaryTimezone: string;
            uid?: string;
        }) => {
            const vcal = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:${prodId}
METHOD:${method}
CALSCALE:${calscale}
BEGIN:VEVENT
ATTENDEE;CUTYPE=INDIVIDUAL;EMAIL="testme@pm.me";PARTSTAT=NEED
 S-ACTION;RSVP=TRUE:mailto:testme@pm.me
ATTENDEE;CN="testKrt";CUTYPE=INDIVIDUAL;EMAIL="aGmailOne@gmail.co
 m";PARTSTAT=ACCEPTED;ROLE=CHAIR:mailto:aGmailOne@gmail.com
DTSTART:20200915T090000
DTEND:20200915T100000
ORGANIZER;CN="testKrt":mailto:aGmailOne@gmail.com
${uid ? `UID:${uid}` : ''}
DTSTAMP:20200821T081914Z
SEQUENCE:1
SUMMARY:Testing something
RRULE:FREQ=DAILY;INTERVAL=2;COUNT=5
END:VEVENT
END:VCALENDAR`;
            const parsedVcal = parse(vcal) as VcalVcalendar;

            return {
                vcalComponent: parsedVcal,
                message: { Time: Math.round(Date.now() / 1000) } as Message,
                icsBinaryString: vcal,
                icsFileName: 'test.ics',
                primaryTimezone,
                hashUid: await generateVeventHashUID(vcal, uid),
                canImportEventColor: false,
            };
        };

        test('when invitations do not have UID', async () => {
            expect.assertions(7);
            return getSupportedEventInvitation(
                await generateVcalSetup({
                    method: ICAL_METHOD.REQUEST,
                    primaryTimezone: 'Asia/Seoul',
                })
            ).catch((e: EventInvitationError) => {
                expect(e.message).toEqual('Invalid invitation');
                expect(e.extendedType).toEqual(EVENT_INVITATION_ERROR_TYPE.MISSING_ORIGINAL_UID);
                expect(e.method).toEqual(ICAL_METHOD.REQUEST);
                expect(e.componentIdentifiers?.prodId).toEqual('DUMMY PRODID');
                expect(e.componentIdentifiers?.domain).toEqual('');
                expect(e.componentIdentifiers?.component).toEqual('vevent');
                expect(e.originalUniqueIdentifier).toEqual('sha1-uid-9141489620e602bf6aa478d0d1607a14a1c8acd5');
            });
        });

        test('when invitations have a non-Gregorian CALSCALE', async () => {
            expect.assertions(7);
            return getSupportedEventInvitation(
                await generateVcalSetup({
                    method: ICAL_METHOD.REQUEST,
                    primaryTimezone: 'Asia/Seoul',
                    calscale: 'NON-GREGORIAN',
                    uid: '12abc@proton.me',
                })
            ).catch((e: any) => {
                expect(e.message).toEqual('Only the Gregorian calendar scale is allowed');
                expect(e.extendedType).toEqual(EVENT_INVITATION_ERROR_TYPE.NON_GREGORIAN);
                expect(e.method).toEqual(ICAL_METHOD.REQUEST);
                expect(e.componentIdentifiers.prodId).toEqual('DUMMY PRODID');
                expect(e.componentIdentifiers.domain).toEqual('proton.me');
                expect(e.componentIdentifiers.component).toEqual('vevent');
                // for errors thrown before parsing the UID, the original unique identifier is a hash
                expect(e.originalUniqueIdentifier).toEqual('sha1-uid-67b8333bda5379ccccf7ac90ba6a5589c99e0f31');
            });
        });

        test('when invitations have an invalid method', async () => {
            expect.assertions(7);
            return getSupportedEventInvitation(
                await generateVcalSetup({
                    method: 'MY_CUSTOM_METHOD',
                    primaryTimezone: 'Asia/Seoul',
                    calscale: 'NON-GREGORIAN',
                    uid: '12abc@proton.me',
                })
            ).catch((e: any) => {
                expect(e.message).toEqual('Invalid method');
                expect(e.extendedType).toEqual(EVENT_INVITATION_ERROR_TYPE.INVALID_METHOD);
                expect(e.method).toBeUndefined();
                expect(e.componentIdentifiers.prodId).toEqual('DUMMY PRODID');
                expect(e.componentIdentifiers.domain).toEqual('proton.me');
                expect(e.componentIdentifiers.component).toEqual('vevent');
                // for errors thrown before parsing the UID, the original unique identifier is a hash
                expect(e.originalUniqueIdentifier).toEqual('sha1-uid-9a7f8df5b13978931ebed7d288c3be84aa4bed78');
            });
        });
    });

    describe('getIsPartyCrasher', () => {
        describe('organizer mode', () => {
            const isOrganizerMode = true;
            const calendarEventUID = 'calendarEventUID';
            const attendeeAddress = 'attendee@pm.me';
            const organizerAddress = 'organizer@pm.me';
            const message = {
                data: {
                    Sender: {
                        Address: attendeeAddress,
                    } as Recipient,
                },
            } as MessageStateWithData;

            it('should return false when there is no event in the DB', async () => {
                const results = await Promise.all(
                    [true, false].map((isPartyCrasherIcs) =>
                        getIsPartyCrasher({
                            isOrganizerMode,
                            message,
                            isPartyCrasherIcs,
                        })
                    )
                );

                expect(results.every((result) => result === false)).toBeTruthy();
            });

            it('should return false when the event in the DB contains the attendee (decryptable event)', async () => {
                const results = await Promise.all(
                    [true, false].map((isPartyCrasherIcs) =>
                        getIsPartyCrasher({
                            isOrganizerMode,
                            invitationApi: {
                                attendee: {
                                    emailAddress: attendeeAddress,
                                } as Participant,
                                organizer: {
                                    emailAddress: organizerAddress,
                                },
                            } as RequireSome<EventInvitation, 'calendarEvent'>,
                            message,
                            isPartyCrasherIcs,
                        })
                    )
                );

                expect(results.every((result) => result === false)).toBeTruthy();
            });

            it('should return true when the event in the DB does not contain the attendee (decryptable event)', async () => {
                const results = await Promise.all(
                    [true, false].map((isPartyCrasherIcs) =>
                        getIsPartyCrasher({
                            isOrganizerMode,
                            invitationApi: {
                                organizer: {
                                    emailAddress: organizerAddress,
                                },
                            } as RequireSome<EventInvitation, 'calendarEvent'>,
                            message,
                            isPartyCrasherIcs,
                        })
                    )
                );

                expect(results.every((result) => result === true)).toBeTruthy();
            });

            it('should return false when the event in the DB contains the attendee (undecryptable event)', async () => {
                const results = await Promise.all(
                    [true, false].map(async (isPartyCrasherIcs) =>
                        getIsPartyCrasher({
                            isOrganizerMode,
                            calendarEvent: {
                                UID: calendarEventUID,
                                AttendeesInfo: {
                                    Attendees: [
                                        {
                                            Token: await generateAttendeeToken(attendeeAddress, calendarEventUID),
                                        },
                                    ] as Attendee[],
                                },
                            } as CalendarEvent,
                            message,
                            isPartyCrasherIcs,
                        })
                    )
                );

                expect(results.every((result) => result === false)).toBeTruthy();
            });

            it('should return true when the event in the DB does not contain the attendee (undecryptable event)', async () => {
                const results = await Promise.all(
                    [true, false].map((isPartyCrasherIcs) =>
                        getIsPartyCrasher({
                            isOrganizerMode,
                            calendarEvent: {
                                UID: calendarEventUID,
                                AttendeesInfo: {
                                    Attendees: [] as Attendee[],
                                },
                            } as CalendarEvent,
                            message,
                            isPartyCrasherIcs,
                        })
                    )
                );

                expect(results.every((result) => result === true)).toBeTruthy();
            });
        });

        describe('attendee mode', () => {
            const isOrganizerMode = false;
            const attendeeAddress = 'attendee@pm.me';
            const organizerAddress = 'organizer@pm.me';
            const message = {
                data: {
                    Sender: {
                        Address: organizerAddress,
                    } as Recipient,
                },
            } as MessageStateWithData;

            it('should return the isPartyCrasher value computed from the ics when the invitation is not in the user calendar', async () => {
                const [truthyResult, falsyResult] = await Promise.all(
                    [true, false].map((isPartyCrasherIcs) =>
                        getIsPartyCrasher({
                            isOrganizerMode,
                            message,
                            isPartyCrasherIcs,
                        })
                    )
                );

                expect(truthyResult).toEqual(true);
                expect(falsyResult).toEqual(false);
            });

            it('should return the isPartyCrasher value computed from the ics when the user is in the invitation attendee list', async () => {
                const [truthyResult, falsyResult] = await Promise.all(
                    [true, false].map((isPartyCrasherIcs) =>
                        getIsPartyCrasher({
                            isOrganizerMode,
                            invitationApi: {
                                attendee: {
                                    emailAddress: attendeeAddress,
                                } as Participant,
                                organizer: {
                                    emailAddress: organizerAddress,
                                },
                            } as RequireSome<EventInvitation, 'calendarEvent'>,
                            message,
                            isPartyCrasherIcs,
                        })
                    )
                );

                expect(truthyResult).toEqual(true);
                expect(falsyResult).toEqual(false);
            });

            it('should return the isPartyCrasher value computed from the ics when the user is not in the invitation attendee list', async () => {
                const [truthyResult, falsyResult] = await Promise.all(
                    [true, false].map((isPartyCrasherIcs) =>
                        getIsPartyCrasher({
                            isOrganizerMode,
                            invitationApi: {} as RequireSome<EventInvitation, 'calendarEvent'>,
                            message,
                            isPartyCrasherIcs,
                        })
                    )
                );

                expect(truthyResult).toEqual(true);
                expect(falsyResult).toEqual(false);
            });
        });
    });
});
