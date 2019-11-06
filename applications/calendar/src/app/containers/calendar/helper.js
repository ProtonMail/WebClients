import {
    startOfDay,
    endOfDay,

    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,

    addDays,
    addWeeks,
    addMonths,
    addYears
} from 'proton-shared/lib/date-fns-utc';

import { VIEWS } from '../../constants';

const { DAY, MONTH, WEEK, YEAR, AGENDA } = VIEWS;

export const getDateRange = (date, range, view, weekStartsOn) => {
    const opts = { weekStartsOn };
    switch (view) {
        case DAY:
            return [startOfDay(date), endOfDay(date)];
        case WEEK:
            if (range >= 0) {
                return [startOfDay(date), endOfDay(addDays(date, range))];
            }
            return [startOfWeek(date, opts), endOfWeek(date, opts)];
        case MONTH:
            if (range >= 0) {
                return [startOfWeek(date, opts), endOfWeek(addWeeks(date, range), opts)];
            }
            return [startOfWeek(startOfMonth(date), opts), endOfWeek(endOfMonth(date), opts)];
        case YEAR:
            return [startOfWeek(startOfYear(date), opts), endOfWeek(endOfYear(date), opts)];
        case AGENDA:
            return [startOfDay(date), addDays(startOfDay(date), 30)];
    }
};

export const getDateDiff = (date, range, view, direction) => {
    switch (view) {
        case DAY:
            return addDays(date, direction);
        case WEEK:
            if (range >= 0) {
                return addDays(date, direction * range);
            }
            return addWeeks(date, direction);
        case MONTH:
            if (range >= 0) {
                return addDays(date, direction * range * 7);
            }
            return addMonths(date, direction);
        case YEAR:
            return addYears(date, direction);
        case AGENDA:
            return addDays(date, direction);
    }
};
