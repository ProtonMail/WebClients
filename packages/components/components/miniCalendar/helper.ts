import { addWeeks, eachDayOfInterval, endOfWeek, isSameDay, startOfMonth, startOfWeek, subWeeks } from 'date-fns';

import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';

import type { DateTuple } from './interface';

/**
 * Get all days to display in the mini calendar for a given date.
 */
export const getDaysInMonth = (
    currentDate: Date,
    { weekStartsOn, weeks }: { weeks: number; weekStartsOn: WeekStartsOn }
) => {
    const startOfMonthDate = startOfMonth(currentDate);
    const startOfWeekDate = startOfWeek(startOfMonthDate, { weekStartsOn });
    // in case of displaying 6 weeks for a month starting on weekStartsOn day,
    // display last week of previous month so that trailing days are displayed both at the beginning and the end
    const adjust = isSameDay(startOfMonthDate, startOfWeekDate) && weeks === 5;

    const start = adjust ? subWeeks(startOfWeekDate, 1) : startOfWeekDate;
    const end = endOfWeek(addWeeks(start, weeks), { weekStartsOn });

    return eachDayOfInterval({ start, end });
};

export const getDateTupleFromMonday = (monday: Date, weekStartsOn?: WeekStartsOn): DateTuple => {
    const startDateInWeek = startOfWeek(monday, { weekStartsOn });
    const endDateInWeek = endOfWeek(monday, { weekStartsOn });
    return [startDateInWeek, endDateInWeek];
};
