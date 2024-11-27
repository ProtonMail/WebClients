import type { DateTuple } from '@proton/components/components/miniCalendar/interface';

import { DateRangeUnit, getDateRangeUnit } from './getDateRangeUnit';

describe('getDateRangeUnit()', () => {
    test.each([
        {
            dateRange: [new Date('2024-11-03T00:00:00.000Z'), new Date('2024-11-03T23:59:59.000Z')],
            unit: DateRangeUnit.Day,
        },
        {
            dateRange: [new Date('2024-11-03T00:00:00.000Z'), new Date('2024-11-09T23:59:59.000Z')],
            unit: DateRangeUnit.Week,
        },
        {
            dateRange: [new Date('2024-10-27T00:00:00.000Z'), new Date('2024-11-30T23:59:59.000Z')],
            unit: DateRangeUnit.Month,
        },
    ])('given $dateRange, should return $unit', ({ dateRange, unit }) => {
        expect(getDateRangeUnit(dateRange as DateTuple)).toEqual(unit);
    });
});
