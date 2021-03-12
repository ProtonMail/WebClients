import { FREQUENCY } from '../../../lib/calendar/constants';
import { getIsRruleEqual } from '../../../lib/calendar/rruleEqual';

const getTest = (a, b, c, result) => ({
    a,
    b,
    c,
    result,
});

describe('rrule equal', () => {
    [
        getTest({ freq: FREQUENCY.ONCE }, undefined, false, false),
        getTest({ freq: FREQUENCY.ONCE }, { freq: FREQUENCY.ONCE }, false, true),
        getTest({ freq: FREQUENCY.ONCE }, { freq: FREQUENCY.WEEKLY }, false, false),
        getTest(
            {
                freq: FREQUENCY.MONTHLY,
                byday: ['TU', 'MO'],
            },
            {
                freq: FREQUENCY.MONTHLY,
                byday: ['MO', 'TU'],
            },
            false,
            true
        ),
        getTest(
            {
                freq: FREQUENCY.MONTHLY,
                byday: ['MO'],
            },
            {
                freq: FREQUENCY.MONTHLY,
                byday: 'MO',
            },
            false,
            false
        ),
        getTest(
            {
                freq: FREQUENCY.MONTHLY,
                byday: ['TU', 'MO'],
            },
            {
                freq: FREQUENCY.WEEKLY,
            },
            false,
            false
        ),
        getTest({ count: 2 }, { count: 2 }, false, true),
        getTest({ count: 2 }, { count: 3 }, false, false),
        getTest(
            {
                freq: FREQUENCY.WEEKLY,
                count: 65,
            },
            {
                freq: FREQUENCY.WEEKLY,
                count: 65,
                byday: 'WE',
            },
            false,
            true
        ),
        getTest(
            {
                freq: FREQUENCY.WEEKLY,
                until: {
                    year: 2020,
                    month: 1,
                    day: 1,
                },
            },
            {
                freq: FREQUENCY.WEEKLY,
                until: {
                    year: 2020,
                    month: 1,
                    day: 2,
                },
            },
            false,
            false
        ),
        getTest(
            {
                freq: FREQUENCY.WEEKLY,
                until: {
                    year: 2020,
                    month: 1,
                    day: 1,
                },
            },
            {
                freq: FREQUENCY.WEEKLY,
                until: {
                    year: 2020,
                    month: 1,
                    day: 1,
                },
            },
            false,
            true
        ),
        getTest(
            {
                until: {
                    year: 2020,
                    month: 1,
                    day: 1,
                },
            },
            {
                until: {
                    year: 2020,
                    month: 1,
                    day: 1,
                    hours: 12,
                    minutes: 59,
                    seconds: 59,
                },
            },
            false,
            true
        ),
        getTest(
            {},
            {
                until: {
                    year: 2020,
                    month: 1,
                    day: 1,
                    hours: 12,
                    minutes: 59,
                    seconds: 59,
                },
            },
            false,
            false
        ),
        getTest(
            {
                until: {
                    year: 2020,
                    month: 1,
                    day: 1,
                    hours: 12,
                    minutes: 59,
                    seconds: 59,
                },
            },
            {},
            false,
            false
        ),
        getTest(
            {
                until: {
                    year: 2020,
                    month: 1,
                    day: 1,
                    hours: 12,
                    minutes: 59,
                    seconds: 59,
                },
            },
            {
                until: {
                    year: 2020,
                    month: 1,
                    day: 2,
                    hours: 12,
                    minutes: 59,
                    seconds: 59,
                },
            },
            false,
            false
        ),
        getTest(
            { freq: FREQUENCY.WEEKLY, byday: [1, 2, 3], interval: 2, wkst: 'SU' },
            { freq: FREQUENCY.WEEKLY, byday: [1, 2, 3], interval: 2 },
            false,
            false
        ),
        getTest(
            { freq: FREQUENCY.WEEKLY, byday: [1, 2, 3], interval: 2, wkst: 'SU' },
            { freq: FREQUENCY.WEEKLY, byday: [1, 2, 3], interval: 2 },
            true,
            true
        ),
        getTest({ bymonth: [1, 3, 2] }, { bymonth: [3, 2, 1] }, false, true),
        getTest({}, { bymonth: [1, 3, 2] }, false, false),
        getTest({ freq: FREQUENCY.WEEKLY, byday: [1] }, { freq: FREQUENCY.WEEKLY }, false, true),
        getTest({ freq: FREQUENCY.WEEKLY, byday: [1], bymonth: [8] }, { freq: FREQUENCY.WEEKLY }, false, false),
        getTest({ freq: FREQUENCY.MONTHLY, bymonthday: [13] }, { freq: FREQUENCY.MONTHLY }, false, true),
        getTest({ freq: FREQUENCY.MONTHLY, bymonthday: [13], byday: [2] }, { freq: FREQUENCY.MONTHLY }, false, false),
        getTest({ freq: FREQUENCY.YEARLY, byday: [7], bymonth: [7] }, { freq: FREQUENCY.YEARLY }, false, true),
        getTest({ freq: FREQUENCY.YEARLY, byday: [7] }, { freq: FREQUENCY.YEARLY }, false, false),
    ].forEach(({ a, b, c, result }, i) => {
        it(`is rrule equal for ${i}`, () => {
            expect(getIsRruleEqual({ value: a }, { value: b }, c)).toEqual(result);
        });
    });
});
