import type { DateTuple } from '@proton/components/components/miniCalendar/interface';
import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';

import { getMonthDateRange } from './getMonthDateRange';
import { getTimezoneAdjustedDateRange } from './getTimezoneAdjustedDateRange';

describe('getMonthDateRange()', () => {
    test.each([
        [
            'with a time change losing an hour',
            new Date('2024-03-15T00:00:00.000Z'),
            [new Date('2024-02-25T00:00:00.000Z'), new Date('2024-04-06T23:59:59.000Z')],
            0,
            'Europe/London',
        ],
        [
            'with a time change gaining an hour',
            new Date('2024-11-03T00:00:00.000Z'),
            [new Date('2024-10-27T00:00:00.000Z'), new Date('2024-11-30T23:59:59.000Z')],
            0,
            'Europe/London',
        ],
        [
            'without a time change',
            new Date('2024-12-25T00:00:00.000Z'),
            [new Date('2024-12-01T00:00:00.000Z'), new Date('2025-01-04T23:59:59.000Z')],
            0,
            'Europe/London',
        ],
        [
            'with week starting on Monday',
            new Date('2024-12-25T00:00:00.000Z'),
            [new Date('2024-11-25T00:00:00.000Z'), new Date('2025-01-05T23:59:59.000Z')],
            1,
            'Europe/London',
        ],
        [
            'with week starting on Saturday',
            new Date('2024-12-25T00:00:00.000Z'),
            [new Date('2024-11-30T00:00:00.000Z'), new Date('2025-01-03T23:59:59.000Z')],
            6,
            'Europe/London',
        ],
        [
            'in a different timezone',
            new Date('2024-12-25T00:00:00.000Z'),
            [new Date('2024-12-01T00:00:00.000Z'), new Date('2025-01-04T23:59:59.000Z')],
            0,
            'Europe/Vilnius',
        ],
    ])(
        'given a date in a month %s, should return the correct date range for that month',
        (_, date, dateRange, weekStartsOn, tzid) => {
            const offsetDateRange = getTimezoneAdjustedDateRange(dateRange as DateTuple, tzid);
            expect(getMonthDateRange(date, weekStartsOn as WeekStartsOn, tzid)).toEqual(offsetDateRange);
        }
    );
});
