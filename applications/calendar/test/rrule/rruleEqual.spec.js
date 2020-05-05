import { FREQUENCY } from '../../src/app/constants';
import { getIsRruleEqual } from '../../src/app/containers/calendar/eventActions/rruleEqual';

const getTest = (a, b, result) => ({
    a,
    b,
    result
});

describe('rrule equal', () => {
    [
        getTest({ freq: FREQUENCY.ONCE }, undefined, false),
        getTest({ freq: FREQUENCY.ONCE }, { freq: FREQUENCY.ONCE }, true),
        getTest({ freq: FREQUENCY.ONCE }, { freq: FREQUENCY.WEEKLY }, false),
        getTest(
            {
                freq: FREQUENCY.MONTHLY,
                byday: ['TU', 'MO']
            },
            {
                freq: FREQUENCY.MONTHLY,
                byday: ['MO', 'TU']
            },
            true
        ),
        getTest(
            {
                freq: FREQUENCY.MONTHLY,
                byday: ['MO']
            },
            {
                freq: FREQUENCY.MONTHLY,
                byday: 'MO'
            },
            false
        ),
        getTest(
            {
                freq: FREQUENCY.MONTHLY,
                byday: ['TU', 'MO']
            },
            {
                freq: FREQUENCY.WEEKLY
            },
            false
        ),
        getTest({ count: 2 }, { count: 2 }, true),
        getTest({ count: 2 }, { count: 3 }, false),
        getTest(
            {
                freq: FREQUENCY.WEEKLY,
                until: {
                    year: 2020,
                    month: 1,
                    day: 1
                }
            },
            {
                freq: FREQUENCY.WEEKLY,
                until: {
                    year: 2020,
                    month: 1,
                    day: 2
                }
            },
            false
        ),
        getTest(
            {
                freq: FREQUENCY.WEEKLY,
                until: {
                    year: 2020,
                    month: 1,
                    day: 1
                }
            },
            {
                freq: FREQUENCY.WEEKLY,
                until: {
                    year: 2020,
                    month: 1,
                    day: 1
                }
            },
            true
        ),
        getTest({ bymonth: [1, 3, 2] }, { bymonth: [3, 2, 1] }, true),
        getTest({}, { bymonth: [1, 3, 2] }, false)
    ].forEach(({ a, b, result }, i) => {
        test(`is rrule equal for ${i}`, () => {
            expect(getIsRruleEqual({ value: a }, { value: b })).toEqual(result);
        });
    });
});
