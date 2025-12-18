import { addDays, addMonths, endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from 'date-fns';

import type { DateTuple } from '@proton/components/components/miniCalendar/interface';
import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { fromUTCDateToTimezone } from '@proton/shared/lib/date/timezone';

import { DateRangeUnit, getDateRangeUnit } from './getDateRangeUnit';
import { getNoonDate } from './getNoonDate';
import { getOffsetAdjustedRange } from './getOffsetAdjustedRange';
import { getTimezoneAdjustedDateRange } from './getTimezoneAdjustedDateRange';

const getMonthRange = (date: Date, weekStartsOn: WeekStartsOn) => {
    // Because the displayed first and last days on the calendar may be in a
    // different month, we have to jump through a few hoops.
    const firstDayOfLastWeek = startOfWeek(date, { weekStartsOn });
    const firstOfMonth = startOfMonth(addMonths(firstDayOfLastWeek, 1));
    const startDate = startOfWeek(firstOfMonth, { weekStartsOn });
    const endDate = endOfWeek(endOfMonth(firstOfMonth), { weekStartsOn });

    return [startDate, endDate];
};

const getDaysRange = (date: Date, dateDifference: DateRangeUnit) => {
    const startDate = startOfDay(addDays(date, 1));
    const endDate = endOfDay(addDays(date, dateDifference === DateRangeUnit.Day ? 1 : 7));

    return [startDate, endDate];
};

export const getNextDateRange = (dateRange: DateTuple, weekStartsOn: WeekStartsOn, tzid: string): DateTuple => {
    const [, end] = dateRange;
    const timezoneAdjustedEnd = fromUTCDateToTimezone(end, tzid);
    const noon = getNoonDate(timezoneAdjustedEnd, false);

    const dateDifference = getDateRangeUnit(dateRange);
    const isMonth = dateDifference === DateRangeUnit.Month;

    const [newStartDate, newEndDate] = isMonth ? getMonthRange(noon, weekStartsOn) : getDaysRange(noon, dateDifference);

    const newDateRange = getOffsetAdjustedRange(newStartDate, newEndDate);

    return getTimezoneAdjustedDateRange(newDateRange, tzid);
};
