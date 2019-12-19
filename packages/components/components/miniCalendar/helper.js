import { addWeeks, eachDayOfInterval, endOfWeek, startOfMonth, startOfWeek } from 'date-fns';

/**
 * Get all days to display in the mini calendar for a given date.
 * @param {Date} currentDate
 * @param {Number} weekStartsOn
 * @param {Number} weeks
 * @returns {Array<Date>}
 */
export const getDaysInMonth = (currentDate, { weekStartsOn, weeks }) => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn });
    const end = endOfWeek(addWeeks(start, weeks), { weekStartsOn });
    return eachDayOfInterval({ start, end });
};
