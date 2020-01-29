import { parse, fromTriggerString, serialize, getMillisecondsFromTriggerString } from '../../lib/calendar/vcal';
import { WEEK, DAY, HOUR, MINUTE, SECOND } from '../../lib/constants';

const vevent = `BEGIN:VEVENT
DTSTAMP:20190719T130854Z
UID:7E018059-2165-4170-B32F-6936E88E61E5
DTSTART;TZID=America/New_York:20190719T120000
DTEND;TZID=Europe/Zurich:20190719T130000
CATEGORIES:ANNIVERSARY,PERSONAL,SPECIAL OCCASION
SUMMARY:Our Blissful Anniversary
END:VEVENT`;

const allDayVevent = `BEGIN:VEVENT
UID:9E018059-2165-4170-B32F-6936E88E61E5
DTSTART;VALUE=DATE:20190812
DTEND;VALUE=DATE:20190813
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
UID:CF0E1C05-CD9A-43D5-AD24-6C631EA2E6A7
TRIGGER:-PT15H
ACTION:DISPLAY
DESCRIPTION:asd
END:VALARM`;

const valarmInVevent = `BEGIN:VEVENT
UID:7E018059-2165-4170-B32F-6936E88E61E5
DTSTART:20190719T120000Z
DTEND:20190719T130000Z
BEGIN:VALARM
TRIGGER:-PT15H
END:VALARM
END:VEVENT`;

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

const veventsRruleMonthly = [veventRruleMonthly1, veventRruleMonthly2];

const veventRruleYearly = `BEGIN:VEVENT
UID:7E018059-2165-4170-B32F-6936E88E61E5
DTSTART:20190719T120000Z
DTEND:20190719T130000Z
RRULE:FREQ=YEARLY;BYMONTH=7;BYMONTHDAY=25
END:VEVENT`;

const veventsRruleYearly = [veventRruleYearly];

describe('calendar', () => {
    it('should parse vevent', () => {
        const result = parse(vevent);

        expect(result).toEqual({
            component: 'vevent',
            uid: {
                value: '7E018059-2165-4170-B32F-6936E88E61E5'
            },
            dtstamp: {
                value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 8, seconds: 54, isUTC: true }
            },
            dtstart: {
                value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: false },
                parameters: { tzid: 'America/New_York' }
            },
            dtend: {
                value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 0, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Zurich' }
            },
            categories: [
                {
                    value: ['ANNIVERSARY', 'PERSONAL', 'SPECIAL OCCASION']
                }
            ],
            summary: {
                value: 'Our Blissful Anniversary'
            }
        });
    });

    it('should parse valarm', () => {
        const result = parse(valarm);

        expect(result).toEqual({
            component: 'valarm',
            uid: {
                value: 'CF0E1C05-CD9A-43D5-AD24-6C631EA2E6A7'
            },
            trigger: {
                value: { weeks: 0, days: 0, hours: 15, minutes: 0, seconds: 0, isNegative: true }
            },
            action: {
                value: 'DISPLAY'
            },
            description: {
                value: 'asd'
            }
        });
    });

    it('should parse all day vevent', () => {
        const { dtstart } = parse(allDayVevent);

        expect(dtstart).toEqual({
            value: { year: 2019, month: 8, day: 12 },
            parameters: { type: 'date' }
        });
    });

    it('should parse valarm in vevent', () => {
        const component = parse(valarmInVevent);

        expect(component).toEqual({
            component: 'vevent',
            components: [
                {
                    component: 'valarm',
                    trigger: {
                        value: { weeks: 0, days: 0, hours: 15, minutes: 0, seconds: 0, isNegative: true }
                    }
                }
            ],
            uid: {
                value: '7E018059-2165-4170-B32F-6936E88E61E5'
            },
            dtstart: {
                value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: true }
            },
            dtend: {
                value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 0, seconds: 0, isUTC: true }
            }
        });
    });

    it('should parse rrule in vevent', () => {
        const components = [...veventsRruleWeekly, ...veventsRruleMonthly, ...veventsRruleYearly].map(parse);

        expect(components).toEqual([
            {
                component: 'vevent',
                uid: {
                    value: '7E018059-2165-4170-B32F-6936E88E61E5'
                },
                dtstart: {
                    value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: true }
                },
                dtend: {
                    value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 0, seconds: 0, isUTC: true }
                },
                rrule: {
                    value: {
                        freq: 'WEEKLY',
                        count: 10,
                        interval: 3,
                        byday: ['WE', 'TH'],
                        until: undefined
                    }
                }
            },
            {
                component: 'vevent',
                uid: {
                    value: '7E018059-2165-4170-B32F-6936E88E61E5'
                },
                dtstart: {
                    value: { year: 2019, month: 7, day: 19 },
                    parameters: { type: 'date' }
                },
                dtend: {
                    value: { year: 2019, month: 7, day: 19 },
                    parameters: { type: 'date' }
                },
                rrule: {
                    value: {
                        freq: 'WEEKLY',
                        byday: 'MO',
                        until: { year: 2020, month: 1, day: 30 }
                    }
                }
            },
            {
                component: 'vevent',
                uid: {
                    value: '7E018059-2165-4170-B32F-6936E88E61E5'
                },
                dtstart: {
                    value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: true }
                },
                dtend: {
                    value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 0, seconds: 0, isUTC: true }
                },
                rrule: {
                    value: {
                        freq: 'WEEKLY',
                        byday: 'MO',
                        until: { year: 2020, month: 1, day: 30, hours: 22, minutes: 59, seconds: 59, isUTC: true }
                    }
                }
            },
            {
                component: 'vevent',
                uid: {
                    value: '7E018059-2165-4170-B32F-6936E88E61E5'
                },
                dtstart: {
                    value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: false },
                    parameters: { tzid: 'America/New_York' }
                },
                dtend: {
                    value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 0, seconds: 0, isUTC: true }
                },
                rrule: {
                    value: {
                        freq: 'WEEKLY',
                        byday: 'MO',
                        until: { year: 2020, month: 1, day: 30, hours: 22, minutes: 59, seconds: 59, isUTC: true }
                    }
                }
            },
            {
                component: 'vevent',
                uid: {
                    value: '7E018059-2165-4170-B32F-6936E88E61E5'
                },
                dtstart: {
                    value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: true }
                },
                dtend: {
                    value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 0, seconds: 0, isUTC: true }
                },
                rrule: {
                    value: {
                        freq: 'MONTHLY',
                        interval: 2,
                        bymonthday: 13,
                        until: { year: 2020, month: 1, day: 30, hours: 23, minutes: 0, seconds: 0, isUTC: true }
                    }
                }
            },
            {
                component: 'vevent',
                uid: {
                    value: '7E018059-2165-4170-B32F-6936E88E61E5'
                },
                dtstart: {
                    value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: true }
                },
                dtend: {
                    value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 0, seconds: 0, isUTC: true }
                },
                rrule: {
                    value: {
                        freq: 'MONTHLY',
                        bysetpos: 2,
                        byday: 'TU',
                        count: 4,
                        until: undefined
                    }
                }
            },
            {
                component: 'vevent',
                uid: {
                    value: '7E018059-2165-4170-B32F-6936E88E61E5'
                },
                dtstart: {
                    value: { year: 2019, month: 7, day: 19, hours: 12, minutes: 0, seconds: 0, isUTC: true }
                },
                dtend: {
                    value: { year: 2019, month: 7, day: 19, hours: 13, minutes: 0, seconds: 0, isUTC: true }
                },
                rrule: {
                    value: {
                        freq: 'YEARLY',
                        bymonth: 7,
                        bymonthday: 25,
                        until: undefined
                    }
                }
            }
        ]);
    });

    it('should parse attendees in vevent', () => {
        const component = parse(veventWithAttendees);

        expect(component).toEqual({
            component: 'vevent',
            uid: {
                value: '7E018059-2165-4170-B32F-6936E88E61E5'
            },
            dtstart: {
                value: { year: 2019, month: 8, day: 12 },
                parameters: { type: 'date' }
            },
            dtend: {
                value: { year: 2019, month: 8, day: 13 },
                parameters: { type: 'date' }
            },
            summary: {
                value: 'text'
            },
            attendee: [
                {
                    value: 'mailto:james@bond.co.uk',
                    parameters: {
                        cutype: 'INDIVIDUAL',
                        role: 'REQ-PARTICIPANT',
                        rsvp: 'TRUE',
                        'x-pm-token': '123',
                        cn: 'james@bond.co.uk'
                    }
                },
                {
                    value: 'mailto:dr.no@mi6.co.uk',
                    parameters: {
                        cutype: 'INDIVIDUAL',
                        role: 'REQ-PARTICIPANT',
                        rsvp: 'TRUE',
                        'x-pm-token': '123',
                        cn: 'Dr No.'
                    }
                },
                {
                    value: 'mailto:moneypenny@mi6.co.uk',
                    parameters: {
                        cutype: 'INDIVIDUAL',
                        role: 'NON-PARTICIPANT',
                        rsvp: 'FALSE',
                        cn: 'Miss Moneypenny'
                    }
                }
            ]
        });
    });

    const trimAll = (str) => str.replace(/\r?\n|\r/g, '');

    it('should round trip valarm in vevent', () => {
        const result = serialize(parse(valarmInVevent));
        expect(trimAll(result)).toEqual(trimAll(valarmInVevent));
    });

    it('should round trip rrule in vevent', () => {
        const vevents = [...veventsRruleWeekly, ...veventsRruleMonthly, ...veventsRruleYearly];
        const results = vevents.map((vevent) => serialize(parse(vevent)));
        expect(results.map(trimAll)).toEqual(vevents.map(trimAll));
    });

    it('should round trip vevent', () => {
        const result = serialize(parse(vevent));
        expect(trimAll(result)).toEqual(trimAll(vevent));
    });

    it('should round trip vevent with attendees', () => {
        const result = serialize(parse(veventWithAttendees));
        expect(trimAll(result)).toEqual(trimAll(veventWithAttendees));
    });

    it('should round trip all day vevent', () => {
        const result = serialize(parse(allDayVevent));
        expect(trimAll(result)).toEqual(trimAll(allDayVevent));
    });

    it('should parse trigger string', () => {
        expect(fromTriggerString('-PT30M')).toEqual({
            weeks: 0,
            days: 0,
            hours: 0,
            minutes: 30,
            seconds: 0,
            isNegative: true
        });
    });

    it('should convert trigger strings into milliseconds', () => {
        expect(getMillisecondsFromTriggerString('-PT30M')).toEqual(-30 * MINUTE);
        expect(getMillisecondsFromTriggerString('PT1H')).toEqual(HOUR);
        expect(getMillisecondsFromTriggerString('-P1D')).toEqual(-DAY);
        expect(getMillisecondsFromTriggerString('-PT2H34M12S')).toEqual(-2 * HOUR - 34 * MINUTE - 12 * SECOND);
        expect(getMillisecondsFromTriggerString('P2W1DT1S')).toEqual(2 * WEEK + DAY + SECOND);
    });
});
