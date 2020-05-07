import { FREQUENCY } from '../../src/app/constants';
import { withRruleUntil } from '../../src/app/containers/calendar/eventActions/rruleUntil';
import { getDateProperty, getDateTimeProperty } from 'proton-shared/lib/calendar/vcalConverter';
import { fromLocalDate } from 'proton-shared/lib/date/timezone';

const getTest = (name, a, b, result) => ({
    name,
    a,
    b,
    result
});

const getUntil = (date) => ({
    ...fromLocalDate(date),
    isUTC: true
});

describe('rrule until', () => {
    [
        getTest(
            'ignore non-until',
            { freq: FREQUENCY.ONCE },
            getDateProperty({
                year: 2020,
                month: 1,
                day: 1
            }),
            { freq: FREQUENCY.ONCE }
        ),
        getTest(
            'convert from a date-time until to date if start is all day',
            {
                freq: FREQUENCY.ONCE,
                until: getUntil(new Date(2020, 1, 10, 12, 59, 59))
            },
            getDateProperty({ year: 2020, month: 1, day: 1 }),
            {
                freq: FREQUENCY.ONCE,
                until: { year: 2020, month: 2, day: 10 }
            }
        ),
        getTest(
            'convert from a date until to date-time if start is part-day',
            {
                freq: FREQUENCY.ONCE,
                until: { year: 2020, month: 2, day: 10 }
            },
            getDateTimeProperty({ year: 2020, month: 1, day: 1, hours: 6, minutes: 12 }, 'Europe/Zurich'),
            {
                freq: FREQUENCY.ONCE,
                until: getUntil(new Date(2020, 1, 10, 22, 59, 59))
            }
        ),
        getTest(
            'convert date-time timezone if start is part-day',
            {
                freq: FREQUENCY.ONCE,
                until: getUntil(new Date(2020, 1, 10, 22, 59, 59))
            },
            getDateTimeProperty({ year: 2020, month: 1, day: 1, hours: 6, minutes: 12 }, 'UTC'),
            {
                freq: FREQUENCY.ONCE,
                until: getUntil(new Date(2020, 1, 10, 23, 59, 59))
            }
        )
    ].forEach(({ name, a, b, result }) => {
        test(name, () => {
            expect(withRruleUntil({ value: a }, b)).toEqual({ value: result });
        });
    });
});
