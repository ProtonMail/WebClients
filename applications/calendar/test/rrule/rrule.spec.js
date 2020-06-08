import { parse } from 'proton-shared/lib/calendar/vcal';
import {
    getDayAndSetpos,
    getIsRruleCustom,
    getSupportedRrule,
    getIsRruleSupported,
    getIsStandardByday,
    getHasConsistentRrule,
} from '../../src/app/helpers/rrule';
import { FREQUENCY } from '../../src/app/constants';

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
    test('returns false for simple recurring events', () => {
        const rrules = [
            {
                freq: FREQUENCY.DAILY,
                interval: 1,
            },
            {
                freq: FREQUENCY.WEEKLY,
                interval: 1,
                byday: 'SA',
            },
            {
                freq: FREQUENCY.MONTHLY,
                interval: 1,
                bymonthday: 23,
            },
            {
                freq: FREQUENCY.YEARLY,
                interval: 1,
                bymonth: 5,
            },
            {
                freq: FREQUENCY.YEARLY,
                interval: 1,
                bymonthday: 23,
            },
        ];
        expect(rrules.map(getIsRruleCustom)).toEqual(rrules.map(() => false));
    });

    test('returns true for supported custom-recurring events', () => {
        const rrules = [
            {
                freq: FREQUENCY.DAILY,
                count: 3,
                interval: 2,
            },
            {
                freq: FREQUENCY.WEEKLY,
                byday: ['SA', 'FR'],
            },
            {
                freq: FREQUENCY.WEEKLY,
                byday: ['SA', 'FR'],
                count: 1,
            },
            {
                freq: FREQUENCY.WEEKLY,
                until: { year: 2020, month: 5, day: 10 },
            },
            {
                freq: FREQUENCY.MONTHLY,
                bysetpos: 2,
                byday: 'WE',
            },
            {
                freq: FREQUENCY.MONTHLY,
                byday: '-1WE',
                until: { year: 2020, month: 5, day: 10 },
            },
            {
                freq: FREQUENCY.YEARLY,
                interval: 2,
            },
            {
                freq: FREQUENCY.YEARLY,
                count: 1,
            },
        ];
        expect(rrules.map(getIsRruleCustom)).toEqual(rrules.map(() => true));
    });

    test('returns false for non-supported custom-recurring events', () => {
        const rrules = [
            {
                freq: FREQUENCY.DAILY,
                count: 3,
                interval: 2,
                byday: ['TU', 'TH'],
            },
            {
                freq: FREQUENCY.WEEKLY,
                byday: ['SA', 'FR'],
                bymonth: 1,
                count: 2,
            },
            {
                freq: FREQUENCY.WEEKLY,
                until: { year: 2020, month: 5, day: 10 },
                bysetpos: 3,
            },
            {
                freq: FREQUENCY.MONTHLY,
                bysetpos: 2,
            },
            {
                freq: FREQUENCY.MONTHLY,
                byday: 'SU',
            },
        ];
        expect(rrules.map(getIsRruleCustom)).toEqual(rrules.map(() => false));
    });
});

describe('getIsRruleSupported', () => {
    test('should accept events with monthly recurring rules of the form BYDAY=+/-nDD', () => {
        const vevents = [
            `BEGIN:VEVENT\r\nRRULE:FREQ=MONTHLY;BYDAY=1SU\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=MONTHLY;BYDAY=+2WE\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=MONTHLY;COUNT=1;BYDAY=4MO\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=MONTHLY;BYDAY=-1SA\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=MONTHLY;COUNT=3;INTERVAL=2;BYDAY=TH;BYSETPOS=-1\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=MONTHLY;BYDAY=TU;BYSETPOS=3\r\nEND:VEVENT`,
        ];
        const rrules = vevents.map((vevent) => {
            const { rrule } = parse(vevent);
            return rrule.value;
        });
        expect(rrules.map(getIsRruleSupported)).toEqual(vevents.map(() => true));
    });

    test('should accept events with valid yearly recurring rules', () => {
        const vevents = [
            `BEGIN:VEVENT\r\nRRULE:FREQ=YEARLY;UNTIL=20200330T150000Z;INTERVAL=1;BYMONTHDAY=30;BYMONTH=3\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=YEARLY;INTERVAL=2;BYMONTH=5\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=YEARLY;INTERVAL=2;BYMONTHDAY=17\r\nEND:VEVENT`,
        ];
        const rrules = vevents.map((vevent) => {
            const { rrule } = parse(vevent);
            return rrule.value;
        });
        expect(rrules.map(getIsRruleSupported)).toEqual(vevents.map(() => true));
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
            `BEGIN:VEVENT\r\nRRULE:FREQ=MONTHLY;INTERVAL=1;BYSETPOS=1;BYDAY=SU,MO,TU,WE,TH,FR,SA\r\nEND:VEVENT`,
        ];
        const rrules = vevents.map((vevent) => {
            const { rrule } = parse(vevent);
            return rrule.value;
        });
        expect(rrules.map(getIsRruleSupported)).toEqual(vevents.map(() => false));
    });

    test('should refuse events with invalid yearly recurring rules', () => {
        const vevents = [
            `BEGIN:VEVENT\r\nRRULE:FREQ=YEARLY;INTERVAL=1;BYMONTH=1,2,3,4,5,6,7,8,9,10,11,12\r\nEND:VEVENT`,
            `BEGIN:VEVENT\r\nRRULE:FREQ=YEARLY;BYMONTHDAY=11,22\r\nEND:VEVENT`,
        ];
        const rrules = vevents.map((vevent) => {
            const { rrule } = parse(vevent);
            return rrule.value;
        });
        expect(rrules.map(getIsRruleSupported)).toEqual(vevents.map(() => false));
    });
});

describe('getSupportedRrule', () => {
    const dtstartPartDayUTC = {
        value: { year: 2020, month: 5, day: 11, hours: 12, minutes: 0, seconds: 0, isUTC: true },
    };
    const dtstartPartDayZoned = {
        value: { year: 2020, month: 5, day: 11, hours: 12, minutes: 0, seconds: 0, isUTC: false },
        parameters: { tzid: 'Antarctica/Troll' },
    };
    const dtstartAllDay = {
        value: { year: 2020, month: 5, day: 11 },
        parameters: { type: 'date' },
    };
    const dtendPartDayUTC = {
        value: { year: 2020, month: 5, day: 11, hours: 12, minutes: 30, seconds: 0, isUTC: true },
    };
    const dtendPartDayZoned = {
        value: { year: 2020, month: 5, day: 11, hours: 12, minutes: 30, seconds: 0, isUTC: false },
        parameters: { tzid: 'Antarctica/Troll' },
    };
    const dtendAllDay = {
        value: { year: 2020, month: 5, day: 12 },
        parameters: { type: 'date' },
    };

    test('should reformat rrules with a badly formatted UNTIL', () => {
        const vevents = [
            {
                dtstart: dtstartPartDayUTC,
                dtend: dtendPartDayUTC,
                rrule: { value: { freq: 'WEEKLY', until: { year: 2020, month: 5, day: 15 } } },
            },
            {
                dtstart: dtstartPartDayZoned,
                dtend: dtendPartDayZoned,
                rrule: { value: { freq: 'WEEKLY', until: { year: 2020, month: 5, day: 15 } } },
            },
            {
                dtstart: dtstartAllDay,
                dtend: dtendAllDay,
                rrule: {
                    value: {
                        freq: 'WEEKLY',
                        until: { year: 2020, month: 5, day: 15, hours: 12, minutes: 0, seconds: 30, isUTC: false },
                    },
                },
            },
        ];
        const expected = [
            {
                value: {
                    freq: 'WEEKLY',
                    until: { year: 2020, month: 5, day: 15, hours: 23, minutes: 59, seconds: 59, isUTC: true },
                },
            },
            {
                value: {
                    freq: 'WEEKLY',
                    until: { year: 2020, month: 5, day: 15, hours: 21, minutes: 59, seconds: 59, isUTC: true },
                },
            },
            { value: { freq: 'WEEKLY', until: { year: 2020, month: 5, day: 15 } } },
        ];
        expect(vevents.map((vevent) => getSupportedRrule(vevent))).toEqual(expected);
    });

    test('should reformat rrules with UNTIL in the middle of the day', () => {
        const vevents = [
            {
                dtstart: dtstartPartDayUTC,
                dtend: dtendPartDayUTC,
                rrule: {
                    value: {
                        freq: 'WEEKLY',
                        until: { year: 2020, month: 5, day: 15, hours: 12, minutes: 0, seconds: 30, isUTC: true },
                    },
                },
            },
            {
                dtstart: dtstartPartDayZoned,
                dtend: dtendPartDayZoned,
                rrule: {
                    value: {
                        freq: 'WEEKLY',
                        until: { year: 2020, month: 5, day: 15, hours: 12, minutes: 0, seconds: 30, isUTC: true },
                    },
                },
            },
        ];
        const expected = [
            {
                value: {
                    freq: 'WEEKLY',
                    until: { year: 2020, month: 5, day: 15, hours: 23, minutes: 59, seconds: 59, isUTC: true },
                },
            },
            {
                value: {
                    freq: 'WEEKLY',
                    until: { year: 2020, month: 5, day: 15, hours: 21, minutes: 59, seconds: 59, isUTC: true },
                },
            },
        ];
        expect(vevents.map((vevent) => getSupportedRrule(vevent))).toEqual(expected);
    });
});

describe('getHasConsistentRrule', () => {
    const dtstartPartDayUTC = {
        value: { year: 2020, month: 5, day: 11, hours: 12, minutes: 0, seconds: 0, isUTC: true },
    };
    const dtendPartDayUTC = {
        value: { year: 2020, month: 5, day: 11, hours: 12, minutes: 30, seconds: 0, isUTC: true },
    };

    test('should filter out inconsistent rrules', () => {
        const rrules = [
            {
                freq: 'MONTHLY',
                byday: '1MO',
            },
            {
                freq: 'MONTHLY',
                byday: '-2MO',
            },
            {
                freq: 'MONTHLY',
                byday: 'SU',
            },
            {
                freq: 'MONTHLY',
                byday: 'MO',
                bysetpos: 3,
            },
        ];
        const vevents = rrules.map((rrule) => ({
            dtstart: dtstartPartDayUTC,
            dtend: dtendPartDayUTC,
            rrule: { value: rrule },
        }));
        const expected = vevents.map(() => false);
        expect(vevents.map((vevent) => getHasConsistentRrule(vevent))).toEqual(expected);
    });
});
