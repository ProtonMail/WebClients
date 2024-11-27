import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';

import type { DateTuple } from '@proton/components/components/miniCalendar/interface';
import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';

import { getOffsetAdjustedRange } from './getOffsetAdjustedRange';
import { getTimezoneAdjustedDateRange } from './getTimezoneAdjustedDateRange';

export const getMonthDateRange = (date: Date, weekStartsOn: WeekStartsOn, tzid: string): DateTuple => {
    const firstOfMonth = startOfMonth(date);
    const startDate = startOfWeek(firstOfMonth, { weekStartsOn });
    const endDate = endOfWeek(endOfMonth(date), { weekStartsOn });

    const newDateRange = getOffsetAdjustedRange(startDate, endDate);

    return getTimezoneAdjustedDateRange(newDateRange, tzid);
};
