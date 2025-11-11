import { addWeeks, endOfDay, endOfWeek, getUnixTime, startOfDay } from 'date-fns';

import { WEEKS_IN_MINI_CALENDAR } from '../constants';

export interface WeekRange {
    start: number;
    end: number;
}

export const generateWeeklyRangeSimple = (startDate: Date) => {
    const weekRangeSimple = [];
    for (let i = 0; i < WEEKS_IN_MINI_CALENDAR; i++) {
        weekRangeSimple.push({
            start: getUnixTime(startOfDay(addWeeks(startDate, i))),
            end: getUnixTime(endOfDay(endOfWeek(addWeeks(startDate, i)))),
        });
    }

    return weekRangeSimple;
};
