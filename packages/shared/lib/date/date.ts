import {
    addMonths,
    differenceInMilliseconds,
    eachDayOfInterval,
    endOfWeek,
    format,
    startOfWeek,
    startOfYear,
} from 'date-fns';

import { DAY } from '../constants';
import type { WeekStartsOn } from '../date-fns-utc/interface';
import { dateLocale } from '../i18n';

interface FormatOptions {
    locale?: Locale;
}

export const YEAR_REGEX = /[0-9]{4}/i;

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
export const getWeekStartsOn = (locale?: Locale) => {
    return locale?.options?.weekStartsOn || 0;
};

export const getDifferenceInDays = (earlierDate: Date, laterDate: Date) => {
    const diff = differenceInMilliseconds(laterDate, earlierDate);
    return Math.floor(diff / DAY);
};

export const isValidDate = (date: Date) => {
    return date instanceof Date && !Number.isNaN(date.getTime());
};

export const getShortenDayFormat = (date: Date) => {
    return format(date, 'do', { locale: dateLocale });
};

export const getWeekday = (weekStartsOn: WeekStartsOn, offset: number = 0): number => {
    return (weekStartsOn + offset) % 7;
};

export const isWeekday = (date: Date, weekStartsOn: WeekStartsOn) => {
    const weekDays = Array.from({ length: 5 }, (_, i) => getWeekday(weekStartsOn, i));
    return weekDays.includes(date.getDay());
};
