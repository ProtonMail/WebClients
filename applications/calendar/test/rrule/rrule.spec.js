import {
    getDayAndSetpos,
    getIsRruleCustom,
    getIsRruleConsistent,
    getIsRruleValid,
    getIsStandardByday
} from '../../src/app/helpers/rrule';
import { FREQUENCY } from '../../src/app/constants';
import { parse } from 'proton-shared/lib/calendar/vcal';

describe('getIsStandardByday', () => {
    test('returns true for standard BYDAY strings', () => {
        const bydays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        expect(bydays.map(getIsStandardByday)).toEqual(bydays.map(() => true));
    });

    test('returns false for non-standard BYDAY strings', () => {
        const bydays = ['1SU', 'SUN', 'S', 'DO', ''];
        expect(bydays.map(getIsStandardByday)).toEqual(bydays.map(() => false));
    });
});

describe('getDayAndSetpos', () => {
    test('gets the day and setpos correctly', () => {
        const bydays = ['1SU', '+2MO', '-1FR', 'WE'];
        const results = [{ setpos: 1, day: 'SU' }, { setpos: 2, day: 'MO' }, { setpos: -1, day: 'FR' }, { day: 'WE' }];
        expect(bydays.map((byday) => getDayAndSetpos(byday))).toEqual(results);
    });
});

describe('getIsRruleCustom', () => {
    test('returns false for non-recurring or simple recurring events', () => {
        const rrules = [
            {
                freq: FREQUENCY.DAILY,
                count: 1,
                interval: 2,
                byday: ['MO', 'SU']
            },
            {
                freq: FREQUENCY.WEEKLY,
                interval: 1,
                byday: 'SA'
            }
        ];
        expect(rrules.map(getIsRruleCustom)).toEqual(rrules.map(() => false));
    });

    test('returns true for supported custom-recurring events', () => {
        const rrules = [
            {
                freq: FREQUENCY.DAILY,
                count: 3,
                interval: 2
            },
            {
                freq: FREQUENCY.WEEKLY,
                byday: ['SA', 'FR']
            },
            {
                freq: FREQUENCY.WEEKLY,
                until: { year: 2020, month: 5, day: 10 }
            },
            {
                freq: FREQUENCY.MONTHLY,
                bysetpos: 2,
                byday: 'WE'
            },
            {
                freq: FREQUENCY.MONTHLY,
                byday: '-1WE'
            },
            {
                freq: FREQUENCY.YEARLY,
                interval: 2
            }
        ];
        expect(rrules.map(getIsRruleCustom)).toEqual(rrules.map(() => true));
    });

    test('returns false for non-supported custom-recurring events', () => {
        const rrules = [
            {
                freq: FREQUENCY.DAILY,
                count: 3,
                interval: 2,
                byday: ['TU', 'TH']
            },
            {
                freq: FREQUENCY.WEEKLY,
                byday: ['SA', 'FR'],
                bymonth: 1,
                count: 2
            },
            {
                freq: FREQUENCY.WEEKLY,
                until: { year: 2020, month: 5, day: 10 },
                bysetpos: 3
            },
            {
                freq: FREQUENCY.MONTHLY,
                bysetpos: 2
            },
            {
                freq: FREQUENCY.MONTHLY,
                byday: 'SU'
            }
        ];
        expect(rrules.map(getIsRruleCustom)).toEqual(rrules.map(() => false));
    });
});

describe('getIsRruleValid', () => {
    test('should accept non-recurring events with RRULE', () => {
        const vevents = [
            `BEGIN:VEVENT\r\nRRULE:FREQ=DAILY;COUNT=1;INTERVAL=2;BYDAY=1SU\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=WEEKLY;COUNT=1;BYDAY=WE,TH,FR;BYMONTH=2,3\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=MONTHLY;COUNT=1,BYMONTHDAY=8;WKST=SA\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=YEARLY;COUNT=1;BYYEARDAY=23,300;BYDAY=SU\r\nEND:VEVENT`
        ];
        const rrules = vevents.map((vevent) => {
            const { rrule } = parse(vevent);
            return rrule.value;
        });
        expect(rrules.map(getIsRruleValid)).toEqual(vevents.map(() => true));
    });

    test('should accept events with monthly recurring rules of the form BYDAY=+/-nDD', () => {
        const vevents = [
            `BEGIN:VEVENT\r\nRRULE:FREQ=MONTHLY;BYDAY=1SU\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=MONTHLY;BYDAY=+2WE\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=MONTHLY;BYDAY=4MO\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=MONTHLY;BYDAY=-1SA\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=MONTHLY;BYDAY=TH;BYSETPOS=-1\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=MONTHLY;BYDAY=TU;BYSETPOS=3\r\nEND:VEVENT`
        ];
        const rrules = vevents.map((vevent) => {
            const { rrule } = parse(vevent);
            return rrule.value;
        });
        expect(rrules.map(getIsRruleValid)).toEqual(vevents.map(() => true));
    });

    test('should accept events with valid yearly recurring rules', () => {
        const vevents = [
            `BEGIN:VEVENT\r\nRRULE:FREQ=YEARLY;UNTIL=20200330T150000Z;INTERVAL=1;BYMONTHDAY=30;BYMONTH=3\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=YEARLY;INTERVAL=2;BYMONTH=5\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=YEARLY;INTERVAL=2;BYMONTHDAY=17\r\nEND:VEVENT`
        ];
        const rrules = vevents.map((vevent) => {
            const { rrule } = parse(vevent);
            return rrule.value;
        });
        expect(rrules.map(getIsRruleValid)).toEqual(vevents.map(() => true));
    });

    test('should refuse events with invalid monthly recurring rules', () => {
        const vevents = [
            `BEGIN:VEVENT\r\nRRULE:FREQ=MONTHLY;BYDAY=1SU,2MO\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=MONTHLY;BYDAY=-2WE\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=MONTHLY;BYDAY=5TH\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=MONTHLY;BYDAY=FR\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=MONTHLY;BYDAY=FR;BYSETPOS=5\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=MONTHLY;BYDAY=TU;BYSETPOS=-2\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=MONTHLY;INTERVAL=2;BYMONTHDAY=10,13,14\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=MONTHLY;INTERVAL=1;BYSETPOS=1;BYDAY=SU,MO,TU,WE,TH,FR,SA\r\nEND:VEVENT`
        ];
        const rrules = vevents.map((vevent) => {
            const { rrule } = parse(vevent);
            return rrule.value;
        });
        expect(rrules.map(getIsRruleValid)).toEqual(vevents.map(() => false));
    });
    test('should refuse events with invalid yearly recurring rules', () => {
        const vevents = [
            `BEGIN:VEVENT\r\nRRULE:FREQ=YEARLY;INTERVAL=1;BYMONTH=1,2,3,4,5,6,7,8,9,10,11,12\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=YEARLY;BYMONTHDAY=11,22\r\nEND:VEVENT`
        ];
        const rrules = vevents.map((vevent) => {
            const { rrule } = parse(vevent);
            return rrule.value;
        });
        expect(rrules.map(getIsRruleValid)).toEqual(vevents.map(() => false));
    });
});

describe('getIsConsistentRrule', () => {
    test('should refuse inconsistent rrules', () => {
        const dtstart = {
            value: { year: 2020, month: 5, day: 11, hours: 12, minutes: 0, seconds: 0, isUTC: true }
        };
        const dtend = {
            value: { year: 2020, month: 5, day: 11, hours: 12, minutes: 30, seconds: 0, isUTC: true }
        };
        const rrules = [
            {
                freq: 'MONTHLY',
                byday: '1MO'
            },
            {
                freq: 'MONTHLY',
                byday: '-2MO'
            },
            {
                freq: 'MONTHLY',
                byday: 'SU'
            },
            {
                freq: 'MONTHLY',
                byday: 'MO',
                bysetpos: 3
            },
            {
                freq: 'MONTHLY',
                bymonthday: 11,
                until: {
                    year: 2020,
                    month: 10,
                    day: 29
                }
            }
        ];
        const vevents = rrules.map((rrule) => ({ dtstart, dtend, rrule: { value: rrule } }));
        expect(vevents.map((vevent) => getIsRruleConsistent(vevent))).toEqual(vevents.map(() => false));
    });
});
