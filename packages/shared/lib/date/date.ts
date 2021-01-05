import {
    eachDayOfInterval,
    startOfWeek,
    endOfWeek,
    startOfYear,
    format,
    addMonths,
    differenceInMilliseconds,
} from 'date-fns';
import { DAY, MONTH } from '../constants';

interface FormatOptions {
    locale?: Locale;
}

/**
 * Get a list with the names of the days of the week according to current locale, where Sunday is the start of the week.
 */
export const getFormattedWeekdays = (stringFormat: string, options?: FormatOptions) => {
    const zeroTime = new Date(0);
    const weekdays = eachDayOfInterval({ start: startOfWeek(zeroTime), end: endOfWeek(zeroTime) });

    return weekdays.map((day) => format(day, stringFormat, options));
};

/**
 * Get a list with the names of the days of the week according to current locale
 */
export const getFormattedMonths = (stringFormat: string, options?: FormatOptions) => {
    const dummyDate = startOfYear(new Date(0));
    const dummyMonths = Array.from({ length: 12 }).map((_, i) => addMonths(dummyDate, i));

    return dummyMonths.map((date) => format(date, stringFormat, options));
};

/**
 * Get the index of the start of week day for a given date-fn locale
 */
export const getWeekStartsOn = ({ options: { weekStartsOn = 0 } = { weekStartsOn: 0 } }: Locale) => weekStartsOn;

export const getDifferenceInMonthsAndDays = (laterDate: Date, earlierDate: Date) => {
    const diff = differenceInMilliseconds(laterDate, earlierDate);
    const months = Math.floor(diff / MONTH);
    const days = Math.floor((diff % MONTH) / DAY);
    return { months, days };
};
