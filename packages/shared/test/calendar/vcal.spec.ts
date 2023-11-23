import {
    fromTriggerString,
    getMillisecondsFromTriggerString,
    getVeventWithoutErrors,
    parse,
    parseWithRecoveryAndMaybeErrors,
    serialize,
} from '../../lib/calendar/vcal';
import { DAY, HOUR, MINUTE, SECOND, WEEK } from '../../lib/constants';
import {
    VcalErrorComponent,
    VcalValarmComponent,
    VcalVcalendarWithMaybeErrors,
    VcalVeventComponent,
    VcalVeventComponentWithMaybeErrors,
} from '../../lib/interfaces/calendar';

const vevent = `BEGIN:VEVENT
DTSTAMP:20190719T130854Z
UID:7E018059-2165-4170-B32F-6936E88E61E5
DTSTART;TZID=America/New_York:20190719T120000
DTEND;TZID=Europe/Zurich:20190719T130000
SEQUENCE:0
CATEGORIES:ANNIVERSARY,PERSONAL,SPECIAL OCCASION
SUMMARY:Our Blissful Anniversary
END:VEVENT`;

const allDayVevent = `BEGIN:VEVENT
UID:9E018059-2165-4170-B32F-6936E88E61E5
DTSTART;VALUE=DATE:20190812
DTEND;VALUE=DATE:20190813
SUMMARY:text
END:VEVENT`;

const veventWithRecurrenceId = `BEGIN:VEVENT
UID:9E018059-2165-4170-B32F-6936E88E61E5
RECURRENCE-ID;TZID=Europe/Zurich:20200311T100000
DTSTART;TZID=Europe/Zurich:20200311T100000
DTEND;TZID=Europe/Zurich:20200312T100000
SUMMARY:text
END:VEVENT`;

const veventWithAttendees = `BEGIN:VEVENT
UID:7E018059-2165-4170-B32F-6936E88E61E5
DTSTART;VALUE=DATE:20190812
DTEND;VALUE=DATE:20190813
SUMMARY:text
ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;RSVP=TRUE;X-PM-TOKEN=123;CN
 =james@bond.co.uk:mailto:james@bond.co.uk
ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;RSVP=TRUE;X-PM-TOKEN=123;CN
 =Dr No.:mailto:dr.no@mi6.co.uk
ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=NON-PARTICIPANT;RSVP=FALSE;CN=Miss Moneypen
 ny:mailto:moneypenny@mi6.co.uk
END:VEVENT`;

const valarm = `BEGIN:VALARM
TRIGGER:-PT15H
ACTION:DISPLAY
DESCRIPTION:asd
END:VALARM`;

const valarmInVevent = `BEGIN:VEVENT
UID:7E018059-2165-4170-B32F-6936E88E61E5
DTSTAMP:20190719T110000Z
DTSTART:20190719T120000Z
DTEND:20190719T130000Z
BEGIN:VALARM
ACTION:DISPLAY
TRIGGER:-PT15H
END:VALARM
END:VEVENT`;

const veventRruleDaily1 = `BEGIN:VEVENT
UID:7E018059-2165-4170-B32F-6936E88E61E5
DTSTART:20190719T120000Z
DTEND:20190719T130000Z
RRULE:FREQ=DAILY;COUNT=10;INTERVAL=3
END:VEVENT`;

const veventRruleDaily2 = `BEGIN:VEVENT
UID:7E018059-2165-4170-B32F-6936E88E61E5
DTSTART;VALUE=DATE:20190719
DTEND;VALUE=DATE:20190719
RRULE:FREQ=DAILY;UNTIL=20200130
END:VEVENT`;

const veventRruleDaily3 = `BEGIN:VEVENT
UID:7E018059-2165-4170-B32F-6936E88E61E5
DTSTART:20190719T120000Z
DTEND:20190719T130000Z
RRULE:FREQ=DAILY;UNTIL=20200130T225959Z
END:VEVENT`;

const veventRruleDaily4 = `BEGIN:VEVENT
UID:7E018059-2165-4170-B32F-6936E88E61E5
DTSTART;TZID=America/New_York:20190719T120000
DTEND:20190719T130000Z
RRULE:FREQ=DAILY;UNTIL=20200130T225959Z
END:VEVENT`;

const veventsRruleDaily = [veventRruleDaily1, veventRruleDaily2, veventRruleDaily3, veventRruleDaily4];

const veventRruleWeekly1 = `BEGIN:VEVENT
UID:7E018059-2165-4170-B32F-6936E88E61E5
DTSTART:20190719T120000Z
DTEND:20190719T130000Z
RRULE:FREQ=WEEKLY;COUNT=10;INTERVAL=3;BYDAY=WE,TH
END:VEVENT`;

const veventRruleWeekly2 = `BEGIN:VEVENT
UID:7E018059-2165-4170-B32F-6936E88E61E5
DTSTART;VALUE=DATE:20190719
DTEND;VALUE=DATE:20190719
RRULE:FREQ=WEEKLY;BYDAY=MO;UNTIL=20200130
END:VEVENT`;

const veventRruleWeekly3 = `BEGIN:VEVENT
UID:7E018059-2165-4170-B32F-6936E88E61E5
DTSTART:20190719T120000Z
DTEND:20190719T130000Z
RRULE:FREQ=WEEKLY;BYDAY=MO;UNTIL=20200130T225959Z
END:VEVENT`;

const veventRruleWeekly4 = `BEGIN:VEVENT
UID:7E018059-2165-4170-B32F-6936E88E61E5
DTSTART;TZID=America/New_York:20190719T120000
DTEND:20190719T130000Z
RRULE:FREQ=WEEKLY;BYDAY=MO;UNTIL=20200130T225959Z
END:VEVENT`;

const veventsRruleWeekly = [veventRruleWeekly1, veventRruleWeekly2, veventRruleWeekly3, veventRruleWeekly4];

const veventRruleMonthly1 = `BEGIN:VEVENT
UID:7E018059-2165-4170-B32F-6936E88E61E5
DTSTART:20190719T120000Z
DTEND:20190719T130000Z
RRULE:FREQ=MONTHLY;INTERVAL=2;BYMONTHDAY=13;UNTIL=20200130T230000Z
END:VEVENT`;

const veventRruleMonthly2 = `BEGIN:VEVENT
UID:7E018059-2165-4170-B32F-6936E88E61E5
DTSTART:20190719T120000Z
DTEND:20190719T130000Z
RRULE:FREQ=MONTHLY;COUNT=4;BYSETPOS=2;BYDAY=TU
END:VEVENT`;

const veventRruleMonthly3 = `BEGIN:VEVENT
UID:7E018059-2165-4170-B32F-6936E88E61E5
DTSTART;VALUE=DATE:20190719
DTEND;VALUE=DATE:20190719
RRULE:FREQ=MONTHLY;BYSETPOS=-1;BYDAY=MO;UNTIL=20200130
END:VEVENT`;

const veventRruleMonthly4 = `BEGIN:VEVENT
UID:7E018059-2165-4170-B32F-6936E88E61E5
DTSTART;TZID=America/New_York:20190719T120000
DTEND:20190719T130000Z
RRULE:FREQ=MONTHLY;BYMONTHDAY=2;UNTIL=20200130T225959Z
END:VEVENT`;

const veventsRruleMonthly = [veventRruleMonthly1, veventRruleMonthly2, veventRruleMonthly3, veventRruleMonthly4];

const veventRruleYearly1 = `BEGIN:VEVENT
UID:7E018059-2165-4170-B32F-6936E88E61E5
DTSTART:20190719T120000Z
DTEND:20190719T130000Z
RRULE:FREQ=YEARLY;COUNT=4;BYMONTH=7;BYMONTHDAY=25
END:VEVENT`;

const veventRruleYearly2 = `BEGIN:VEVENT
UID:7E018059-2165-4170-B32F-6936E88E61E5
DTSTART;VALUE=DATE:20190719
DTEND;VALUE=DATE:20190719
RRULE:FREQ=YEARLY;INTERVAL=2;UNTIL=20200130
END:VEVENT`;

const veventRruleYearly3 = `BEGIN:VEVENT
UID:7E018059-2165-4170-B32F-6936E88E61E5
DTSTART:20190719T120000Z
DTEND:20190719T130000Z
RRULE:FREQ=YEARLY;INTERVAL=2;BYMONTH=7;BYMONTHDAY=25;UNTIL=20200130T225959Z
END:VEVENT`;

const veventRruleYearly4 = `BEGIN:VEVENT
UID:7E018059-2165-4170-B32F-6936E88E61E5
DTSTART;TZID=America/New_York:20190719T120000
DTEND:20190719T130000Z
RRULE:FREQ=YEARLY;UNTIL=20200130T225959Z
END:VEVENT`;

const veventsRruleYearly = [veventRruleYearly1, veventRruleYearly2, veventRruleYearly3, veventRruleYearly4];

const vfreebusy = `BEGIN:VFREEBUSY
UID:19970901T095957Z-76A912@example.com
ORGANIZER:mailto:jane_doe@example.com
ATTENDEE:mailto:john_public@example.com
DTSTAMP:19970901T100000Z
FREEBUSY:19971015T050000Z/PT8H30M,19971015T160000Z/PT5H30M,19971015T223000Z/PT6H30M
URL:http://example.com/pub/busy/jpublic-01.ifb
COMMENT:This iCalendar file contains busy time information for the next three months.
END:VFREEBUSY`;

const vfreebusy2 = `BEGIN:VFREEBUSY
UID:19970901T115957Z-76A912@example.com
DTSTAMP:19970901T120000Z
ORGANIZER:jsmith@example.com
DTSTART:19980313T141711Z
DTEND:19980410T141711Z
FREEBUSY:19980314T233000Z/19980315T003000Z
FREEBUSY:19980316T153000Z/19980316T163000Z
FREEBUSY:19980318T030000Z/19980318T040000Z
URL:http://www.example.com/calendar/busytime/jsmith.ifb
END:VFREEBUSY`;

const veventWithTrueBoolean = `BEGIN:VEVENT
X-PM-PROTON-REPLY;VALUE=BOOLEAN:TRUE
END:VEVENT`;

const veventWithFalseBoolean = `BEGIN:VEVENT
X-PM-PROTON-REPLY;VALUE=BOOLEAN:FALSE
END:VEVENT`;

const veventWithRandomBoolean = `BEGIN:VEVENT
X-PM-PROTON-REPLY;VALUE=BOOLEAN:GNEEEE
END:VEVENT`;

const veventWithInvalidVAlarm = `
BEGIN:VEVENT
DESCRIPTION;LANGUAGE=en-US:\n\n\n
UID:040000008200E00074C5B7101A82E00800000000B058B6A2A081D901000000000000000
    0100000004A031FE80ACD7C418A7A1762749176F121
SUMMARY:Calendar test
DTSTART;TZID=Eastern Standard Time:20230513T123000
DTEND;TZID=Eastern Standard Time:20230513T130000
CLASS:PUBLIC
PRIORITY:5
DTSTAMP:20230508T153204Z
TRANSP:OPAQUE
STATUS:CONFIRMED
SEQUENCE:0
LOCATION;LANGUAGE=en-US:
BEGIN:VALARM
DESCRIPTION:REMINDER
TRIGGER;RELATED=START:P
ACTION:DISPLAY
END:VALARM
END:VEVENT
`;

describe('calendar', () => {
    it('should parse vcalendar', () => {
        const result = parse(`BEGIN:VCALENDAR
PRODID:-//Google Inc//Google Calendar 70.9054//EN
VERSION:2.0
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Daily
X-WR-TIMEZONE:Europe/Vilnius
END:VCALENDAR`);
        expect(result).toEqual({
            component: 'vcalendar',
            version: {
                value: '2.0',
            },
            prodid: {
                value: '-//Google Inc//Google Calendar 70.9054//EN',
            },
            calscale: {
                value: 'GREGORIAN',
            },
            method: {
                value: 'PUBLISH',
            },
            'x-wr-timezone': {
                value: 'Europe/Vilnius',
            },
            'x-wr-calname': {
                value: 'Daily',
            },
        });
    });

    it('should parse vevent', () => {
        const result = parse(vevent);

        expect(result).toEqual({
            component: 'vevent',
            uid: {
                value: '7E018059-2165-4170-B32F-6936E88E61E5',
            },
            dtstamp: {
                value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 8, seconds: 54, isUTC: true },
            },
            dtstart: {
                value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: false },
                parameters: { tzid: 'America/New_York' },
            },
            dtend: {
                value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 0, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Zurich' },
            },
            sequence: {
                value: 0,
            },
            categories: [
                {
                    value: ['ANNIVERSARY', 'PERSONAL', 'SPECIAL OCCASION'],
                },
            ],
            summary: {
                value: 'Our Blissful Anniversary',
            },
        });
    });

    it('should parse Boolean properties', () => {
        expect(parse(veventWithTrueBoolean)).toEqual({
            component: 'vevent',
            'x-pm-proton-reply': { value: 'true', parameters: { type: 'boolean' } },
        });
        expect(parse(veventWithFalseBoolean)).toEqual({
            component: 'vevent',
            'x-pm-proton-reply': { value: 'false', parameters: { type: 'boolean' } },
        });
        expect(parse(veventWithRandomBoolean)).toEqual({
            component: 'vevent',
            'x-pm-proton-reply': { value: 'false', parameters: { type: 'boolean' } },
        });
    });

    it('should parse valarm', () => {
        const result = parse(valarm) as VcalValarmComponent;

        expect(result).toEqual({
            component: 'valarm',
            trigger: {
                value: { weeks: 0, days: 0, hours: 15, minutes: 0, seconds: 0, isNegative: true },
            },
            action: {
                value: 'DISPLAY',
            },
            description: {
                value: 'asd',
            },
        });
    });

    it('should parse vfreebusy2', () => {
        expect(parse(vfreebusy2)).toEqual({
            component: 'vfreebusy',
            uid: {
                value: '19970901T115957Z-76A912@example.com',
            },
            dtstamp: {
                value: { year: 1997, month: 9, day: 1, hours: 12, minutes: 0, seconds: 0, isUTC: true },
            },
            organizer: {
                value: 'jsmith@example.com',
            },
            dtstart: {
                value: {
                    year: 1998,
                    month: 3,
                    day: 13,
                    hours: 14,
                    minutes: 17,
                    seconds: 11,
                    isUTC: true,
                },
            },
            dtend: {
                value: {
                    year: 1998,
                    month: 4,
                    day: 10,
                    hours: 14,
                    minutes: 17,
                    seconds: 11,
                    isUTC: true,
                },
            },
            freebusy: [
                {
                    value: [
                        {
                            start: {
                                year: 1998,
                                month: 3,
                                day: 14,
                                hours: 23,
                                minutes: 30,
                                seconds: 0,
                                isUTC: true,
                            },
                            end: {
                                year: 1998,
                                month: 3,
                                day: 15,
                                hours: 0,
                                minutes: 30,
                                seconds: 0,
                                isUTC: true,
                            },
                        },
                    ],
                },
                {
                    value: [
                        {
                            start: {
                                year: 1998,
                                month: 3,
                                day: 16,
                                hours: 15,
                                minutes: 30,
                                seconds: 0,
                                isUTC: true,
                            },
                            end: {
                                year: 1998,
                                month: 3,
                                day: 16,
                                hours: 16,
                                minutes: 30,
                                seconds: 0,
                                isUTC: true,
                            },
                        },
                    ],
                },
                {
                    value: [
                        {
                            start: {
                                year: 1998,
                                month: 3,
                                day: 18,
                                hours: 3,
                                minutes: 0,
                                seconds: 0,
                                isUTC: true,
                            },
                            end: {
                                year: 1998,
                                month: 3,
                                day: 18,
                                hours: 4,
                                minutes: 0,
                                seconds: 0,
                                isUTC: true,
                            },
                        },
                    ],
                },
            ],
            url: {
                value: 'http://www.example.com/calendar/busytime/jsmith.ifb',
            },
        });
    });

    it('should parse vfreebusy', () => {
        expect(parse(vfreebusy)).toEqual({
            component: 'vfreebusy',
            uid: {
                value: '19970901T095957Z-76A912@example.com',
            },
            dtstamp: {
                value: { year: 1997, month: 9, day: 1, hours: 10, minutes: 0, seconds: 0, isUTC: true },
            },
            organizer: {
                value: 'mailto:jane_doe@example.com',
            },
            attendee: [
                {
                    value: 'mailto:john_public@example.com',
                },
            ],
            freebusy: [
                {
                    value: [
                        {
                            start: { year: 1997, month: 10, day: 15, hours: 5, minutes: 0, seconds: 0, isUTC: true },
                            duration: { weeks: 0, days: 0, hours: 8, minutes: 30, seconds: 0, isNegative: false },
                        },
                        {
                            start: { year: 1997, month: 10, day: 15, hours: 16, minutes: 0, seconds: 0, isUTC: true },
                            duration: { weeks: 0, days: 0, hours: 5, minutes: 30, seconds: 0, isNegative: false },
                        },
                        {
                            start: { year: 1997, month: 10, day: 15, hours: 22, minutes: 30, seconds: 0, isUTC: true },
                            duration: { weeks: 0, days: 0, hours: 6, minutes: 30, seconds: 0, isNegative: false },
                        },
                    ],
                },
            ],
            comment: [
                {
                    value: 'This iCalendar file contains busy time information for the next three months.',
                },
            ],
            url: {
                value: 'http://example.com/pub/busy/jpublic-01.ifb',
            },
        });
    });

    it('should parse all day vevent', () => {
        const { dtstart } = parse(allDayVevent) as VcalVeventComponent;

        expect(dtstart).toEqual({
            value: { year: 2019, month: 8, day: 12 },
            parameters: { type: 'date' },
        });
    });

    it('should parse vevent with recurrence id', () => {
        const { dtstart, 'recurrence-id': recurrenceId } = parse(veventWithRecurrenceId) as VcalVeventComponent;

        expect(recurrenceId).toEqual({
            value: { year: 2020, month: 3, day: 11, hours: 10, minutes: 0, seconds: 0, isUTC: false },
            parameters: { tzid: 'Europe/Zurich' },
        });

        expect(dtstart).toEqual({
            value: { year: 2020, month: 3, day: 11, hours: 10, minutes: 0, seconds: 0, isUTC: false },
            parameters: { tzid: 'Europe/Zurich' },
        });
    });

    it('should parse valarm in vevent', () => {
        const component = parse(valarmInVevent) as VcalVeventComponent;

        expect(component).toEqual({
            component: 'vevent',
            components: [
                {
                    component: 'valarm',
                    action: { value: 'DISPLAY' },
                    trigger: {
                        value: { weeks: 0, days: 0, hours: 15, minutes: 0, seconds: 0, isNegative: true },
                    },
                },
            ],
            uid: {
                value: '7E018059-2165-4170-B32F-6936E88E61E5',
            },
            dtstamp: {
                value: { year: 2019, month: 7, day: 19, hours: 11, minutes: 0, seconds: 0, isUTC: true },
            },
            dtstart: {
                value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: true },
            },
            dtend: {
                value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 0, seconds: 0, isUTC: true },
            },
        });
    });

    it('should parse daily rrule in vevent', () => {
        const components = veventsRruleDaily.map(parse);

        expect(components).toEqual([
            {
                component: 'vevent',
                uid: {
                    value: '7E018059-2165-4170-B32F-6936E88E61E5',
                },
                dtstart: {
                    value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: true },
                },
                dtend: {
                    value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 0, seconds: 0, isUTC: true },
                },
                rrule: {
                    value: {
                        freq: 'DAILY',
                        count: 10,
                        interval: 3,
                    },
                },
            },
            {
                component: 'vevent',
                uid: {
                    value: '7E018059-2165-4170-B32F-6936E88E61E5',
                },
                dtstart: {
                    value: { year: 2019, month: 7, day: 19 },
                    parameters: { type: 'date' },
                },
                dtend: {
                    value: { year: 2019, month: 7, day: 19 },
                    parameters: { type: 'date' },
                },
                rrule: {
                    value: {
                        freq: 'DAILY',
                        until: { year: 2020, month: 1, day: 30 },
                    },
                },
            },
            {
                component: 'vevent',
                uid: {
                    value: '7E018059-2165-4170-B32F-6936E88E61E5',
                },
                dtstart: {
                    value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: true },
                },
                dtend: {
                    value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 0, seconds: 0, isUTC: true },
                },
                rrule: {
                    value: {
                        freq: 'DAILY',
                        until: { year: 2020, month: 1, day: 30, hours: 22, minutes: 59, seconds: 59, isUTC: true },
                    },
                },
            },
            {
                component: 'vevent',
                uid: {
                    value: '7E018059-2165-4170-B32F-6936E88E61E5',
                },
                dtstart: {
                    value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: false },
                    parameters: { tzid: 'America/New_York' },
                },
                dtend: {
                    value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 0, seconds: 0, isUTC: true },
                },
                rrule: {
                    value: {
                        freq: 'DAILY',
                        until: { year: 2020, month: 1, day: 30, hours: 22, minutes: 59, seconds: 59, isUTC: true },
                    },
                },
            },
        ]);
    });

    it('should parse weekly rrule in vevent', () => {
        const components = veventsRruleWeekly.map(parse);

        expect(components).toEqual([
            {
                component: 'vevent',
                uid: {
                    value: '7E018059-2165-4170-B32F-6936E88E61E5',
                },
                dtstart: {
                    value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: true },
                },
                dtend: {
                    value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 0, seconds: 0, isUTC: true },
                },
                rrule: {
                    value: {
                        freq: 'WEEKLY',
                        count: 10,
                        interval: 3,
                        byday: ['WE', 'TH'],
                    },
                },
            },
            {
                component: 'vevent',
                uid: {
                    value: '7E018059-2165-4170-B32F-6936E88E61E5',
                },
                dtstart: {
                    value: { year: 2019, month: 7, day: 19 },
                    parameters: { type: 'date' },
                },
                dtend: {
                    value: { year: 2019, month: 7, day: 19 },
                    parameters: { type: 'date' },
                },
                rrule: {
                    value: {
                        freq: 'WEEKLY',
                        byday: 'MO',
                        until: { year: 2020, month: 1, day: 30 },
                    },
                },
            },
            {
                component: 'vevent',
                uid: {
                    value: '7E018059-2165-4170-B32F-6936E88E61E5',
                },
                dtstart: {
                    value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: true },
                },
                dtend: {
                    value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 0, seconds: 0, isUTC: true },
                },
                rrule: {
                    value: {
                        freq: 'WEEKLY',
                        byday: 'MO',
                        until: { year: 2020, month: 1, day: 30, hours: 22, minutes: 59, seconds: 59, isUTC: true },
                    },
                },
            },
            {
                component: 'vevent',
                uid: {
                    value: '7E018059-2165-4170-B32F-6936E88E61E5',
                },
                dtstart: {
                    value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: false },
                    parameters: { tzid: 'America/New_York' },
                },
                dtend: {
                    value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 0, seconds: 0, isUTC: true },
                },
                rrule: {
                    value: {
                        freq: 'WEEKLY',
                        byday: 'MO',
                        until: { year: 2020, month: 1, day: 30, hours: 22, minutes: 59, seconds: 59, isUTC: true },
                    },
                },
            },
        ]);
    });

    it('should parse monthly rrule in vevent', () => {
        const components = veventsRruleMonthly.map(parse);

        expect(components).toEqual([
            {
                component: 'vevent',
                uid: {
                    value: '7E018059-2165-4170-B32F-6936E88E61E5',
                },
                dtstart: {
                    value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: true },
                },
                dtend: {
                    value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 0, seconds: 0, isUTC: true },
                },
                rrule: {
                    value: {
                        freq: 'MONTHLY',
                        interval: 2,
                        bymonthday: 13,
                        until: { year: 2020, month: 1, day: 30, hours: 23, minutes: 0, seconds: 0, isUTC: true },
                    },
                },
            },
            {
                component: 'vevent',
                uid: {
                    value: '7E018059-2165-4170-B32F-6936E88E61E5',
                },
                dtstart: {
                    value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: true },
                },
                dtend: {
                    value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 0, seconds: 0, isUTC: true },
                },
                rrule: {
                    value: {
                        freq: 'MONTHLY',
                        bysetpos: 2,
                        byday: 'TU',
                        count: 4,
                    },
                },
            },
            {
                component: 'vevent',
                uid: {
                    value: '7E018059-2165-4170-B32F-6936E88E61E5',
                },
                dtstart: {
                    value: { year: 2019, month: 7, day: 19 },
                    parameters: { type: 'date' },
                },
                dtend: {
                    value: { year: 2019, month: 7, day: 19 },
                    parameters: { type: 'date' },
                },
                rrule: {
                    value: {
                        freq: 'MONTHLY',
                        bysetpos: -1,
                        byday: 'MO',
                        until: { year: 2020, month: 1, day: 30 },
                    },
                },
            },
            {
                component: 'vevent',
                uid: {
                    value: '7E018059-2165-4170-B32F-6936E88E61E5',
                },
                dtstart: {
                    value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: false },
                    parameters: { tzid: 'America/New_York' },
                },
                dtend: {
                    value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 0, seconds: 0, isUTC: true },
                },
                rrule: {
                    value: {
                        freq: 'MONTHLY',
                        bymonthday: 2,
                        until: { year: 2020, month: 1, day: 30, hours: 22, minutes: 59, seconds: 59, isUTC: true },
                    },
                },
            },
        ]);
    });

    it('should parse yearly rrule in vevent', () => {
        const components = veventsRruleYearly.map(parse);

        expect(components).toEqual([
            {
                component: 'vevent',
                uid: {
                    value: '7E018059-2165-4170-B32F-6936E88E61E5',
                },
                dtstart: {
                    value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: true },
                },
                dtend: {
                    value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 0, seconds: 0, isUTC: true },
                },
                rrule: {
                    value: {
                        freq: 'YEARLY',
                        bymonth: 7,
                        bymonthday: 25,
                        count: 4,
                    },
                },
            },
            {
                component: 'vevent',
                uid: {
                    value: '7E018059-2165-4170-B32F-6936E88E61E5',
                },
                dtstart: {
                    value: { year: 2019, month: 7, day: 19 },
                    parameters: { type: 'date' },
                },
                dtend: {
                    value: { year: 2019, month: 7, day: 19 },
                    parameters: { type: 'date' },
                },
                rrule: {
                    value: {
                        freq: 'YEARLY',
                        interval: 2,
                        until: { year: 2020, month: 1, day: 30 },
                    },
                },
            },
            {
                component: 'vevent',
                uid: {
                    value: '7E018059-2165-4170-B32F-6936E88E61E5',
                },
                dtstart: {
                    value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: true },
                },
                dtend: {
                    value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 0, seconds: 0, isUTC: true },
                },
                rrule: {
                    value: {
                        freq: 'YEARLY',
                        interval: 2,
                        bymonth: 7,
                        bymonthday: 25,
                        until: { year: 2020, month: 1, day: 30, hours: 22, minutes: 59, seconds: 59, isUTC: true },
                    },
                },
            },
            {
                component: 'vevent',
                uid: {
                    value: '7E018059-2165-4170-B32F-6936E88E61E5',
                },
                dtstart: {
                    value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: false },
                    parameters: { tzid: 'America/New_York' },
                },
                dtend: {
                    value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 0, seconds: 0, isUTC: true },
                },
                rrule: {
                    value: {
                        freq: 'YEARLY',
                        until: { year: 2020, month: 1, day: 30, hours: 22, minutes: 59, seconds: 59, isUTC: true },
                    },
                },
            },
        ]);
    });

    it('should parse attendees in vevent', () => {
        const component = parse(veventWithAttendees);

        expect(component).toEqual({
            component: 'vevent',
            uid: {
                value: '7E018059-2165-4170-B32F-6936E88E61E5',
            },
            dtstart: {
                value: { year: 2019, month: 8, day: 12 },
                parameters: { type: 'date' },
            },
            dtend: {
                value: { year: 2019, month: 8, day: 13 },
                parameters: { type: 'date' },
            },
            summary: {
                value: 'text',
            },
            attendee: [
                {
                    value: 'mailto:james@bond.co.uk',
                    parameters: {
                        cutype: 'INDIVIDUAL',
                        role: 'REQ-PARTICIPANT',
                        rsvp: 'TRUE',
                        'x-pm-token': '123',
                        cn: 'james@bond.co.uk',
                    },
                },
                {
                    value: 'mailto:dr.no@mi6.co.uk',
                    parameters: {
                        cutype: 'INDIVIDUAL',
                        role: 'REQ-PARTICIPANT',
                        rsvp: 'TRUE',
                        'x-pm-token': '123',
                        cn: 'Dr No.',
                    },
                },
                {
                    value: 'mailto:moneypenny@mi6.co.uk',
                    parameters: {
                        cutype: 'INDIVIDUAL',
                        role: 'NON-PARTICIPANT',
                        rsvp: 'FALSE',
                        cn: 'Miss Moneypenny',
                    },
                },
            ],
        });
    });

    const trimAll = (str: string) => str.replace(/\r?\n ?|\r/g, '');

    it('should round trip valarm in vevent', () => {
        const result = serialize(parse(valarmInVevent));
        expect(trimAll(result)).toEqual(trimAll(valarmInVevent));
    });

    it('should round trip vfreebusy', () => {
        const result = serialize(parse(vfreebusy));
        expect(trimAll(result)).toEqual(trimAll(vfreebusy));
    });

    it('should round trip vfreebusy2', () => {
        const result = serialize(parse(vfreebusy2));
        expect(trimAll(result)).toEqual(trimAll(vfreebusy2));
    });

    it('should round trip rrule in vevent', () => {
        const vevents = [...veventsRruleDaily, ...veventsRruleWeekly, ...veventsRruleMonthly, ...veventsRruleYearly];
        const results = vevents.map((vevent) => serialize(parse(vevent)));
        expect(results.map(trimAll)).toEqual(vevents.map(trimAll));
    });

    it('should round trip vevent', () => {
        const result = serialize(parse(vevent));
        expect(trimAll(result)).toEqual(trimAll(vevent));
    });

    it('should round trip vevent with recurrence-id', () => {
        const result = serialize(parse(veventWithRecurrenceId));
        expect(trimAll(result)).toEqual(trimAll(veventWithRecurrenceId));
    });

    it('should round trip vevent with attendees', () => {
        const result = serialize(parse(veventWithAttendees));
        expect(trimAll(result)).toEqual(trimAll(veventWithAttendees));
    });

    it('should round trip all day vevent', () => {
        const result = serialize(parse(allDayVevent));
        expect(trimAll(result)).toEqual(trimAll(allDayVevent));
    });

    it('should normalize exdate', () => {
        const veventWithExdate = `BEGIN:VEVENT
RRULE:FREQ=DAILY;COUNT=6
DTSTART;TZID=Europe/Zurich:20200309T043000
DTEND;TZID=Europe/Zurich:20200309T063000
EXDATE:19960402T010000Z,19960403T010000Z,19960404T010000Z
EXDATE;TZID=Europe/Zurich:20200311T043000
EXDATE;TZID=Europe/Zurich:20200313T043000
EXDATE;VALUE=DATE:20200311
END:VEVENT
`;
        const normalizedVevent = `BEGIN:VEVENT
RRULE:FREQ=DAILY;COUNT=6
DTSTART;TZID=Europe/Zurich:20200309T043000
DTEND;TZID=Europe/Zurich:20200309T063000
EXDATE:19960402T010000Z
EXDATE:19960403T010000Z
EXDATE:19960404T010000Z
EXDATE;TZID=Europe/Zurich:20200311T043000
EXDATE;TZID=Europe/Zurich:20200313T043000
EXDATE;VALUE=DATE:20200311
END:VEVENT`;
        const result = serialize(parse(veventWithExdate));
        expect(trimAll(result)).toEqual(trimAll(normalizedVevent));
    });

    it('should parse trigger string', () => {
        expect(fromTriggerString('-PT30M')).toEqual({
            weeks: 0,
            days: 0,
            hours: 0,
            minutes: 30,
            seconds: 0,
            isNegative: true,
        });
    });

    it('should convert trigger strings into milliseconds', () => {
        expect(getMillisecondsFromTriggerString('-PT30M')).toEqual(-30 * MINUTE);
        expect(getMillisecondsFromTriggerString('PT1H')).toEqual(HOUR);
        expect(getMillisecondsFromTriggerString('-P1D')).toEqual(-DAY);
        expect(getMillisecondsFromTriggerString('-PT2H34M12S')).toEqual(-2 * HOUR - 34 * MINUTE - 12 * SECOND);
        expect(getMillisecondsFromTriggerString('P2W1DT1S')).toEqual(2 * WEEK + DAY + SECOND);
    });

    it('should filter out invalid vAlarm', () => {
        const parsed = parseWithRecoveryAndMaybeErrors(veventWithInvalidVAlarm) as VcalVeventComponentWithMaybeErrors;
        expect(getVeventWithoutErrors(parsed)).toEqual({
            component: 'vevent',
            components: [],
            description: { value: '', parameters: { language: 'en-US' } },
            uid: {
                value: '040000008200E00074C5B7101A82E00800000000B058B6A2A081D901000000000000000   0100000004A031FE80ACD7C418A7A1762749176F121',
            },
            summary: {
                value: 'Calendar test',
            },
            dtstart: {
                value: { year: 2023, month: 5, day: 13, hours: 12, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Eastern Standard Time' },
            },
            dtend: {
                value: { year: 2023, month: 5, day: 13, hours: 13, minutes: 0, seconds: 0, isUTC: false },
                parameters: {
                    tzid: 'Eastern Standard Time',
                },
            },
            class: { value: 'PUBLIC' },
            priority: { value: 5 },
            dtstamp: {
                value: { year: 2023, month: 5, day: 8, hours: 15, minutes: 32, seconds: 4, isUTC: true },
            },
            transp: { value: 'OPAQUE' },
            status: { value: 'CONFIRMED' },
            sequence: { value: 0 },
            location: { value: '', parameters: { language: 'en-US' } },
        });
    });
});

describe('parseWithRecoveryAndMaybeErrors', () => {
    it('should catch errors from badly formatted all-day dates (with recovery for those off)', () => {
        const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:test-uid
DTSTAMP:20200405T143241Z
DTSTART:20200309
END:VEVENT
END:VCALENDAR`;
        const result = parseWithRecoveryAndMaybeErrors(ics, { retryDateTimes: false }) as VcalVcalendarWithMaybeErrors;

        expect(result.component).toEqual('vcalendar');
        expect((result.components as VcalErrorComponent[])[0].error).toMatch('invalid date-time value');
    });

    it('should catch errors from badly formatted date-times (with recovery for those off)', () => {
        const ics = `BEGIN:VCALENDAR
X-LOTUS-CHARSET:UTF-8
VERSION:2.0
PRODID:http://www.bahn.de
METHOD:PUBLISH
BEGIN:VEVENT
UID:bahn2023-06-21082400
CLASS:PUBLIC
SUMMARY:Hamburg Hbf -> Paris Est
DTSTART;TZID=Europe/Berlin:2023-06-21T082400
DTEND;TZID=Europe/Berlin:2023-06-21T165400
DTSTAMP:2023-06-13T212500Z
END:VEVENT
END:VCALENDAR`;

        const result = parseWithRecoveryAndMaybeErrors(ics, { retryDateTimes: false }) as VcalVcalendarWithMaybeErrors;

        expect(result.component).toEqual('vcalendar');
        expect((result.components as VcalErrorComponent[])[0].error).toMatch('invalid date-time value');
    });

    it('should catch errors from badly formatted dates (with recovery for those off)', () => {
        const ics = `BEGIN:VCALENDAR
X-LOTUS-CHARSET:UTF-8
VERSION:2.0
PRODID:http://www.bahn.de
METHOD:PUBLISH
BEGIN:VEVENT
UID:bahn2023-06-21082400
CLASS:PUBLIC
SUMMARY:Hamburg Hbf -> Paris Est
DTSTART;VALUE=DATE:2023-06-21
DTEND;VALUE=DATE:2023-06-21
DTSTAMP:20230613T212500Z
END:VEVENT
END:VCALENDAR`;

        const result = parseWithRecoveryAndMaybeErrors(ics, { retryDateTimes: false }) as VcalVcalendarWithMaybeErrors;

        expect(result.component).toEqual('vcalendar');
        expect((result.components as VcalErrorComponent[])[0].error).toMatch('could not extract integer');
    });
});
