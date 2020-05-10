/**
 * Pending date-fn to implement UTC functions https://github.com/date-fns/date-fns/issues/376
 */
export { default as eachDayOfInterval } from './eachDayOfInterval';
export { default as startOfDay } from './startOfDay';
export { default as endOfDay } from './endOfDay';
export { default as startOfWeek } from './startOfWeek';
export { default as endOfWeek } from './endOfWeek';
export { default as getWeekNumber } from './getWeekNumber';
export { default as differenceInCalendarDays } from './differenceInCalendarDays';

export const startOfYear = (date: Date) => {
    return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
};
export const endOfYear = (date: Date) => {
    return new Date(Date.UTC(date.getUTCFullYear() + 1, 0, 0, 23, 59, 59, 999));
};

export const startOfMonth = (date: Date) => {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
};
export const endOfMonth = (date: Date) => {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));
};

export const min = (a: Date, b: Date) => {
    return +a > +b ? b : a;
};

export const max = (a: Date, b: Date) => {
    return +a > +b ? a : b;
};

export const addMilliseconds = (date: Date, amount: number) => new Date(date.getTime() + amount);

export const MILLISECONDS_IN_MINUTE = 60000;
export const addMinutes = (date: Date, amount: number) => addMilliseconds(date, amount * MILLISECONDS_IN_MINUTE);

export const addDays = (date: Date, amount: number) => {
    const result = new Date(date);
    result.setUTCDate(date.getUTCDate() + amount);
    return result;
};

export const addWeeks = (date: Date, amount: number) => {
    return addDays(date, amount * 7);
};

export const getDaysInMonth = (date: Date) => {
    const year = date.getUTCFullYear();
    const monthIndex = date.getUTCMonth();
    const lastDayOfMonth = new Date(0);
    lastDayOfMonth.setUTCFullYear(year, monthIndex + 1, 0);
    lastDayOfMonth.setUTCHours(0, 0, 0, 0);
    return lastDayOfMonth.getUTCDate();
};

export const addMonths = (date: Date, amount: number) => {
    const result = new Date(+date);
    const desiredMonth = date.getUTCMonth() + amount;
    const dateWithDesiredMonth = new Date(0);
    dateWithDesiredMonth.setUTCFullYear(date.getUTCFullYear(), desiredMonth, 1);
    dateWithDesiredMonth.setUTCHours(0, 0, 0, 0);
    const daysInMonth = getDaysInMonth(dateWithDesiredMonth);
    // Set the last day of the new month
    // if the original date was the last day of the longer month
    result.setUTCMonth(desiredMonth, Math.min(daysInMonth, date.getUTCDate()));
    return result;
};

export const addYears = (date: Date, amount: number) => {
    return addMonths(date, amount * 12);
};

export const isSameYear = (dateLeft: Date, dateRight: Date) => {
    return dateLeft.getUTCFullYear() === dateRight.getUTCFullYear();
};

export const isSameMonth = (dateLeft: Date, dateRight: Date) => {
    if (!isSameYear(dateLeft, dateRight)) {
        return false;
    }
    return dateLeft.getUTCMonth() === dateRight.getUTCMonth();
};

export const isSameDay = (dateLeft: Date, dateRight: Date) => {
    if (!isSameMonth(dateLeft, dateRight)) {
        return false;
    }
    return dateLeft.getUTCDate() === dateRight.getUTCDate();
};

/**
 * Check if a later date happens on the following day to an earlier date
 * @param {Date} dateLeft       Earlier date
 * @param {Date} dateRight      Later date
 */
export const isNextDay = (dateLeft: Date, dateRight: Date) => {
    const tomorrow = new Date(Date.UTC(dateLeft.getUTCFullYear(), dateLeft.getUTCMonth(), dateLeft.getUTCDate() + 1));
    return isSameDay(tomorrow, dateRight);
};

export { default as format } from './format';
