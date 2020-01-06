import { addWeeks, subWeeks, eachDayOfInterval, endOfWeek, startOfMonth, startOfWeek, isSameDay } from 'date-fns';

/**
 * Get all days to display in the mini calendar for a given date.
 * @param {Date} currentDate
 * @param {Number} weekStartsOn
 * @param {Number} weeks
 * @returns {Array<Date>}
 */
export const getDaysInMonth = (currentDate, { weekStartsOn, weeks }) => {
    const startOfMonthDate = startOfMonth(currentDate);
    const startOfWeekDate = startOfWeek(startOfMonthDate, { weekStartsOn });
    // in case of displaying 6 weeks for a month starting on weekStartsOn day,
    // display last week of previous month so that trailing days are displayed both at the beginning and the end
    const adjust = isSameDay(startOfMonthDate, startOfWeekDate) && weeks === 5;

    const start = adjust ? subWeeks(startOfWeekDate, 1) : startOfWeekDate;
    const end = endOfWeek(addWeeks(start, weeks), { weekStartsOn });

    return eachDayOfInterval({ start, end });
};
