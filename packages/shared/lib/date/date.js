import {
    eachDayOfInterval,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    format,
    addMonths
} from 'date-fns';

/**
 * Get a list with the names of the days of the week according to current locale
 * @param {String} stringFormat
 * @param {Object} options
 *
 * @return {Array<String>}
 */
export const getFormattedWeekdays = (stringFormat, options) => {
    const zeroTime = new Date(0);
    const weekdays = eachDayOfInterval({ start: startOfWeek(zeroTime), end: endOfWeek(zeroTime) });

    return weekdays.map((day) => format(day, stringFormat, options));
};

/**
 * Get a list with the names of the days of the week according to current locale
 * @param {String} stringFormat
 * @param {Object} options
 *
 * @return {Array<String>}
 */
export const getFormattedMonths = (stringFormat, options) => {
    const dummyDate = startOfYear(new Date(0));
    const dummyMonths = Array.from({ length: 12 }).map((_, i) => addMonths(dummyDate, i));
    return dummyMonths.map((date) => format(date, stringFormat, options));
};

/**
 * Get a list with the short name of the days of the month according to current options
 * @param {String} stringFormat
 * @param {Object} options
 * @return {Object}         [1st, 2nd, ...]
 */
export const getFormattedDaysOfMonth = (stringFormat, options) => {
    const dummyDate = new Date(0);
    const monthDays = eachDayOfInterval({ start: startOfMonth(dummyDate), end: endOfMonth(dummyDate) });
    return monthDays.map((day) => format(day, stringFormat, options));
};

/**
 * Get the index of the start of week day for a given date-fn locale
 * @param {Object} locale
 */
export const getWeekStartsOn = ({ options: { weekStartsOn = 0 } }) => weekStartsOn;

export const isDateYYMMDDEqual = (dateA, dateB) => {
    return (
        dateA.getUTCFullYear() === dateB.getUTCFullYear() &&
        dateA.getUTCMonth() === dateB.getUTCMonth() &&
        dateA.getUTCDate() === dateB.getUTCDate()
    );
};
