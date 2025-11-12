import {
    addWeeks,
    differenceInCalendarWeeks,
    endOfDay,
    endOfWeek,
    getUnixTime,
    startOfDay,
    startOfWeek,
} from 'date-fns';

import { WEEKS_IN_MINI_CALENDAR } from '../constants';

export interface WeekRange {
    start: number;
    end: number;
}

export const generateWeeklyRangeSimple = (startDate: Date, endDate?: Date) => {
    const weekRangeSimple = [];

    const numberOfWeeks = endDate
        ? Math.max(1, differenceInCalendarWeeks(endDate, startDate) + 1)
        : WEEKS_IN_MINI_CALENDAR;

    for (let i = 0; i < numberOfWeeks; i++) {
        weekRangeSimple.push({
            start: getUnixTime(startOfDay(startOfWeek(addWeeks(startDate, i)))),
            end: getUnixTime(endOfDay(endOfWeek(addWeeks(startDate, i)))),
        });
    }

    return weekRangeSimple;
};
