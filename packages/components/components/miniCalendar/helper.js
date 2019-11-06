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

/**
 * Get the week number for a day.
 * @param {Date} currentDate
 * @returns {number}
 */
export const getWeek = (currentDate) => {
    const firstJanuary = new Date(currentDate.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((currentDate - firstJanuary) / 86400000 + firstJanuary.getDay() + 1) / 7);
    if (weekNumber > 52) {
        return 1;
    }
    return weekNumber;
};
