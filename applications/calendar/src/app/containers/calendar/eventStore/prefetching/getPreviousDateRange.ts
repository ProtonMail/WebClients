import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek, subDays, subMonths } from 'date-fns';

import type { DateTuple } from '@proton/components/components/miniCalendar/interface';
import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';

import { DateRangeUnit, getDateRangeUnit } from './getDateRangeUnit';
import { getNoonDate } from './getNoonDate';
import { getOffsetAdjustedRange } from './getOffsetAdjustedRange';
import { getTimezoneAdjustedDateRange } from './getTimezoneAdjustedDateRange';
import { toSpecificTimezone } from './toSpecificTimezone';

const getMonthRange = (date: Date, weekStartsOn: WeekStartsOn) => {
    // Because the displayed first and last days on the calendar may be in a
    // different month, we have to jump through a few hoops.
    const lastDayOfFirstWeek = endOfWeek(date, { weekStartsOn });
    const firstOfMonth = startOfMonth(subMonths(lastDayOfFirstWeek, 1));
    const startDate = startOfWeek(firstOfMonth, { weekStartsOn });
    const endDate = endOfWeek(endOfMonth(firstOfMonth), { weekStartsOn });

    return [startDate, endDate];
};

const getDaysRange = (date: Date, dateDifference: DateRangeUnit) => {
    const endDate = endOfDay(subDays(date, 1));
    const startDate = startOfDay(subDays(date, dateDifference === DateRangeUnit.Day ? 1 : 7));

    return [startDate, endDate];
};

export const getPreviousDateRange = (dateRange: DateTuple, weekStartsOn: WeekStartsOn, tzid: string): DateTuple => {
    const [start] = dateRange;
    const timezoneAdjustedStart = toSpecificTimezone(start, tzid);
    const noon = getNoonDate(timezoneAdjustedStart, true);

    const dateDifference = getDateRangeUnit(dateRange);
    const isMonth = dateDifference === DateRangeUnit.Month;

    const [newStartDate, newEndDate] = isMonth ? getMonthRange(noon, weekStartsOn) : getDaysRange(noon, dateDifference);

    const newDateRange = getOffsetAdjustedRange(newStartDate, newEndDate);

    return getTimezoneAdjustedDateRange(newDateRange, tzid);
};
