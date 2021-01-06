import {
    eachDayOfInterval,
    startOfWeek,
    endOfWeek,
    startOfYear,
    format,
    addMonths,
    differenceInMilliseconds,
} from 'date-fns';
import { DAY, MONTH, SECOND, HOUR, MINUTE, YEAR } from '../constants';

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

export const getTimeRemaining = (endTime: Date) => {
    const diff = differenceInMilliseconds(endTime, new Date());
    const seconds = Math.floor((diff / SECOND) % 60);
    const minutes = Math.floor((diff / MINUTE) % 60);
    const hours = Math.floor((diff / HOUR) % 24);
    const days = Math.floor((diff / DAY) % (7 * 4));
    const months = Math.floor((diff / MONTH) % 12);
    const years = Math.floor(diff / YEAR);
    return {
        years,
        months,
        days,
        hours,
        minutes,
        seconds,
    };
};
