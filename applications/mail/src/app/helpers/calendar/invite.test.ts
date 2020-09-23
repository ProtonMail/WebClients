import { getIsRruleSupported } from 'proton-shared/lib/calendar/integration/rrule';
import { parse } from 'proton-shared/lib/calendar/vcal';
import { VcalVcalendar, VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { RequireSome } from 'proton-shared/lib/interfaces/utils';
import { Message } from '../../models/message';
import { getSupportedEventInvitation, parseEventInvitation } from './invite';

describe('getIsRruleSupported for invitations', () => {
    test('should accept events with daily recurring rules valid for invitations', () => {
        const vevents = [
            `BEGIN:VEVENT\r\nRRULE:FREQ=DAILY;UNTIL=20200330T150000Z;INTERVAL=100;BYMONTH=3\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=DAILY;INTERVAL=2;BYSECOND=30;BYMINUTE=5,10,15;BYHOUR=10\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=DAILY;INTERVAL=2;BYWEEKNO=13;COUNT=499;WKST=TH\r\nEND:VEVENT`
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
            `BEGIN:VEVENT\r\nRRULE:FREQ=DAILY;INTERVAL=1000;BYMONTHDAY=11,22\r\nEND:VEVENT`
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
            `BEGIN:VEVENT\r\nRRULE:FREQ=YEARLY;INTERVAL=2;BYMONTHDAY=17,22;COUNT=499\r\nEND:VEVENT`
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
            `BEGIN:VEVENT\r\nRRULE:FREQ=YEARLY;INTERVAL=100;BYMONTHDAY=11,22\r\nEND:VEVENT`
        ];
        const rrules = vevents.map((vevent) => {
            const parsedVevent = parse(vevent) as RequireSome<VcalVeventComponent, 'rrule'>;
            return parsedVevent.rrule.value;
        });
        expect(rrules.map((rrule) => getIsRruleSupported(rrule, true))).toEqual(vevents.map(() => false));
    });
});

describe('getSupportedEventInvitation', () => {
    test('should refuse invitations with inconsistent custom yearly recurrence rules', () => {
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
        const parsedInvitation = parseEventInvitation(invitation) as VcalVcalendar;
        const message = { Time: Math.round(Date.now() / 1000) } as Message;
        expect(() => getSupportedEventInvitation(parsedInvitation, message)).toThrowError('Invalid invitation');
    });
});
