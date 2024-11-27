import type { DateTuple } from '@proton/components/components/miniCalendar/interface';

import { getTimezoneAdjustedDateRange } from './getTimezoneAdjustedDateRange';

const dateRange: DateTuple = [new Date('2024-10-27T00:00:00.000Z'), new Date('2024-11-30T23:59:59.000Z')];

describe('getTimezoneAdjustedDateRange()', () => {
    test.each([
        ['UTC', [new Date('2024-10-27T00:00:00.000Z'), new Date('2024-11-30T23:59:59.000Z')]],
        ['Europe/London', [new Date('2024-10-26T23:00:00.000Z'), new Date('2024-11-30T23:59:59.000Z')]],
        ['Europe/Vilnius', [new Date('2024-10-26T21:00:00.000Z'), new Date('2024-11-30T21:59:59.000Z')]],
    ])(
        'given %s timezone and a date range, should return the correct date range adjusted for timezone',
        (tzid, expectedDateRange) => {
            expect(getTimezoneAdjustedDateRange(dateRange, tzid)).toEqual(expectedDateRange);
        }
    );
});
