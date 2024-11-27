import type { DateTuple } from '@proton/components/components/miniCalendar/interface';
import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';

import { getNextDateRange } from './getNextDateRange';
import { getTimezoneAdjustedDateRange } from './getTimezoneAdjustedDateRange';

jest.mock('@proton/shared/lib/i18n', () => ({
    dateLocale: { code: 'en-GB' },
}));

describe('getNextDateRange()', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    test.each([
        [
            'day',
            [new Date('2024-11-03T00:00:00.000Z'), new Date('2024-11-03T23:59:59.000Z')],
            [new Date('2024-11-04T00:00:00.000Z'), new Date('2024-11-04T23:59:59.999Z')],
            0,
            'Europe/London',
        ],
        [
            'week',
            [new Date('2024-11-03T00:00:00.000Z'), new Date('2024-11-09T23:59:59.000Z')],
            [new Date('2024-11-10T00:00:00.000Z'), new Date('2024-11-16T23:59:59.999Z')],
            0,
            'Europe/London',
        ],
        [
            'week with time change losing an hour',
            [new Date('2024-03-31T00:00:00.000Z'), new Date('2024-04-06T23:59:59.000Z')],
            [new Date('2024-04-07T00:00:00.000Z'), new Date('2024-04-13T23:59:59.999Z')],
            0,
            'Europe/London',
        ],
        [
            'week with time change gaining an hour',
            [new Date('2024-10-27T00:00:00.000Z'), new Date('2024-11-02T23:59:59.000Z')],
            [new Date('2024-11-03T00:00:00.000Z'), new Date('2024-11-09T23:59:59.999Z')],
            0,
            'Europe/London',
        ],
        [
            'month',
            [new Date('2024-10-27T00:00:00.000Z'), new Date('2024-11-30T23:59:59.000Z')],
            [new Date('2024-12-01T00:00:00.000Z'), new Date('2025-01-04T23:59:59.999Z')],
            0,
            'Europe/London',
        ],
        [
            'month with week starting on Monday',
            [new Date('2024-10-28T00:00:00.000Z'), new Date('2024-12-01T23:59:59.000Z')],
            [new Date('2024-11-25T00:00:00.000Z'), new Date('2025-01-05T23:59:59.999Z')],
            1,
            'Europe/London',
        ],
        [
            'month with week starting on Saturday',
            [new Date('2024-10-26T00:00:00.000Z'), new Date('2024-11-29T23:59:59.000Z')],
            [new Date('2024-11-30T00:00:00.000Z'), new Date('2025-01-03T23:59:59.999Z')],
            6,
            'Europe/London',
        ],
        [
            'month in different timezone',
            [new Date('2024-10-27T00:00:00.000Z'), new Date('2024-11-30T23:59:59.000Z')],
            [new Date('2024-12-01T00:00:00.000Z'), new Date('2025-01-04T23:59:59.999Z')],
            0,
            'Europe/Vilnius',
        ],
    ])(
        'given a %s date range, should return the correct next date range',
        (_, givenDateRange, expectedDateRange, weekStartsOn, tzid) => {
            const offsetExpectedRange = getTimezoneAdjustedDateRange(expectedDateRange as DateTuple, tzid);
            expect(getNextDateRange(givenDateRange as DateTuple, weekStartsOn as WeekStartsOn, tzid)).toEqual(
                offsetExpectedRange
            );
        }
    );
});
