import { utc } from '@date-fns/utc';
import {
    addDays as addDaysInZone,
    addMonths as addMonthsInZone,
    addWeeks as addWeeksInZone,
    addYears as addYearsInZone,
    endOfMonth as endOfMonthInZone,
    endOfYear as endOfYearInZone,
    getDaysInMonth as getDaysInMonthInZone,
    startOfMonth as startOfMonthInZone,
    startOfYear as startOfYearInZone,
} from 'date-fns';

import { DAY } from './constants';

/**
 * UTC versions of date-fns helpers. They return plain Dates, not the UTCDates that date-fns returns with `in: utc`,
 * so callers reading the result with local getters keep their current behaviour.
 */

export const startOfYear = (date: Date) => new Date(+startOfYearInZone(date, { in: utc }));
export const endOfYear = (date: Date) => new Date(+endOfYearInZone(date, { in: utc }));

export const startOfMonth = (date: Date) => new Date(+startOfMonthInZone(date, { in: utc }));
export const endOfMonth = (date: Date) => new Date(+endOfMonthInZone(date, { in: utc }));

export const min = (a: Date, b: Date) => {
    return +a > +b ? b : a;
};

export const max = (a: Date, b: Date) => {
    return +a > +b ? a : b;
};

export const addDays = (date: Date, amount: number) => new Date(+addDaysInZone(date, amount, { in: utc }));

export const addWeeks = (date: Date, amount: number) => new Date(+addWeeksInZone(date, amount, { in: utc }));

export const getDaysInMonth = (date: Date) => getDaysInMonthInZone(date, { in: utc });

export const addMonths = (date: Date, amount: number) => new Date(+addMonthsInZone(date, amount, { in: utc }));

export const addYears = (date: Date, amount: number) => new Date(+addYearsInZone(date, amount, { in: utc }));

/*
 * The isSame* and isNextDay helpers stay hand-written: Calendar calls them in render loops, and the date-fns versions
 * are about 10x slower because they build a UTCDate for each argument.
 */
export const isSameYear = (dateLeft: Date, dateRight: Date) => {
    return dateLeft.getUTCFullYear() === dateRight.getUTCFullYear();
};

export const isSameMonth = (dateLeft: Date, dateRight: Date) => {
    return isSameYear(dateLeft, dateRight) && dateLeft.getUTCMonth() === dateRight.getUTCMonth();
};

export const isSameDay = (dateLeft: Date, dateRight: Date) => {
    return Math.floor(+dateLeft / DAY) === Math.floor(+dateRight / DAY);
};

/**
 * Check if a later date happens on the following day to an earlier date
 * @param {Date} dateLeft       Earlier date
 * @param {Date} dateRight      Later date
 */
export const isNextDay = (dateLeft: Date, dateRight: Date) => {
    return Math.floor(+dateRight / DAY) - Math.floor(+dateLeft / DAY) === 1;
};
