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

export const getDateRange = (date: Date, range: number, view: VIEWS, weekStartsOn: number) => {
    const opts = { weekStartsOn };
    switch (view) {
        case VIEWS.DAY:
            return [startOfDay(date), endOfDay(date)];
        case VIEWS.WEEK:
            if (range >= 0) {
                return [startOfDay(date), endOfDay(addDays(date, range))];
            }
            return [startOfWeek(date, opts), endOfWeek(date, opts)];
        case VIEWS.MONTH:
            if (range >= 0) {
                return [startOfWeek(date, opts), endOfWeek(addWeeks(date, range), opts)];
            }
            return [startOfWeek(startOfMonth(date), opts), endOfWeek(endOfMonth(date), opts)];
        case VIEWS.YEAR:
            return [startOfWeek(startOfYear(date), opts), endOfWeek(endOfYear(date), opts)];
        case VIEWS.AGENDA:
            return [startOfDay(date), addDays(startOfDay(date), 30)];
    }
};

export const getDateDiff = (date: Date, range: number, view: VIEWS, direction: number) => {
    switch (view) {
        case VIEWS.DAY:
            return addDays(date, direction);
        case VIEWS.WEEK:
            if (range >= 0) {
                return addDays(date, direction * (1 + range));
            }
            return addWeeks(date, direction);
        case VIEWS.MONTH:
            if (range >= 0) {
                return addDays(date, direction * (1 + range) * 7);
            }
            return addMonths(date, direction);
        case VIEWS.YEAR:
            return addYears(date, direction);
        case VIEWS.AGENDA:
            return addDays(date, direction);
    }
};
