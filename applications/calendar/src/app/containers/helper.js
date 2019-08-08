import {
    addDays,
    addWeeks,
    addMonths,
    addYears,
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear
} from 'date-fns';

import { VIEWS } from '../constants';

const { DAY, MONTH, WEEK, YEAR, AGENDA } = VIEWS;

export const getDateRange = (date, view, weekStartsOn) => {
    const opts = { weekStartsOn };
    switch (view) {
        case DAY:
            return [startOfDay(date), endOfDay(date)];
        case WEEK:
            return [startOfWeek(date, opts), endOfWeek(date, opts)];
        case MONTH:
            return [startOfWeek(startOfMonth(date), opts), endOfWeek(endOfMonth(date), opts)];
        case YEAR:
            return [startOfWeek(startOfYear(date), opts), endOfWeek(endOfYear(date), opts)];
        case AGENDA:
            return [startOfWeek(startOfMonth(date), opts), endOfWeek(endOfMonth(date), opts)];
    }
};

export const getDateDiff = (date, view, diff) => {
    switch (view) {
        case DAY:
            return addDays(date, diff);
        case WEEK:
            return addWeeks(date, diff);
        case MONTH:
            return addMonths(date, diff);
        case YEAR:
            return addYears(date, diff);
        case AGENDA:
            return addMonths(date, diff);
    }
};
