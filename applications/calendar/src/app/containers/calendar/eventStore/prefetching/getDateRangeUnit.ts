import { differenceInDays } from 'date-fns';

import type { DateTuple } from '@proton/components/components/miniCalendar/interface';

export enum DateRangeUnit {
    Day = 'day',
    Month = 'month',
    Week = 'week',
}

export const getDateRangeUnit = (dateRange: DateTuple) => {
    const [start, end] = dateRange;
    const diff = differenceInDays(end, start);

    if (diff > 7) {
        return DateRangeUnit.Month;
    }

    if (diff < 5) {
        return DateRangeUnit.Day;
    }

    return DateRangeUnit.Week;
};
