import { FREQUENCY } from '../../../lib/calendar/constants';
import { getIsRruleEqual } from '../../../lib/calendar/rruleEqual';

const getTest = (a, b, result) => ({
    a,
    b,
    result,
});

describe('rrule equal', () => {
    [
        getTest({ freq: FREQUENCY.ONCE }, undefined, false),
        getTest({ freq: FREQUENCY.ONCE }, { freq: FREQUENCY.ONCE }, true),
        getTest({ freq: FREQUENCY.ONCE }, { freq: FREQUENCY.WEEKLY }, false),
        getTest(
            {
                freq: FREQUENCY.MONTHLY,
                byday: ['TU', 'MO'],
            },
            {
                freq: FREQUENCY.MONTHLY,
                byday: ['MO', 'TU'],
            },
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
            false
        ),
        getTest({ count: 2 }, { count: 2 }, true),
        getTest({ count: 2 }, { count: 3 }, false),
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
            false
        ),
        getTest({ bymonth: [1, 3, 2] }, { bymonth: [3, 2, 1] }, true),
        getTest({}, { bymonth: [1, 3, 2] }, false),
        getTest({ freq: FREQUENCY.WEEKLY, byday: [1] }, { freq: FREQUENCY.WEEKLY }, true),
        getTest({ freq: FREQUENCY.WEEKLY, byday: [1], bymonth: [8] }, { freq: FREQUENCY.WEEKLY }, false),
        getTest({ freq: FREQUENCY.MONTHLY, bymonthday: [13] }, { freq: FREQUENCY.MONTHLY }, true),
        getTest({ freq: FREQUENCY.MONTHLY, bymonthday: [13], byday: [2] }, { freq: FREQUENCY.MONTHLY }, false),
        getTest({ freq: FREQUENCY.YEARLY, byday: [7], bymonth: [7] }, { freq: FREQUENCY.YEARLY }, true),
        getTest({ freq: FREQUENCY.YEARLY, byday: [7] }, { freq: FREQUENCY.YEARLY }, false),
    ].forEach(({ a, b, result }, i) => {
        it(`is rrule equal for ${i}`, () => {
            expect(getIsRruleEqual({ value: a }, { value: b })).toEqual(result);
        });
    });
});
