import {
    addWeeks,
    subWeeks,
    eachDayOfInterval,
    startOfMonth,
    isSameDay,
    setDay,
    setISOWeek,
    startOfWeek,
    endOfWeek,
} from 'date-fns';
import { DateTuple, WeekStartsOn } from './index.d';

/**
 * Get all days to display in the mini calendar for a given date.
 */
export const getDaysInMonth = (
    currentDate: Date,
    { weekStartsOn, weeks }: { weeks: number; weekStartsOn: WeekStartsOn }
) => {
    const startOfMonthDate = startOfMonth(currentDate);
    const startOfWeekDate = startOfWeek(startOfMonthDate, { weekStartsOn });
    // in case of displaying 6 weeks for a month starting on weekStartsOn day,
    // display last week of previous month so that trailing days are displayed both at the beginning and the end
    const adjust = isSameDay(startOfMonthDate, startOfWeekDate) && weeks === 5;

    const start = adjust ? subWeeks(startOfWeekDate, 1) : startOfWeekDate;
    const end = endOfWeek(addWeeks(start, weeks), { weekStartsOn });

    return eachDayOfInterval({ start, end });
};

export const getDateTupleFromWeekNumber = (date: Date, weekNumber: number, weekStartsOn?: WeekStartsOn): DateTuple => {
    /*
        ISO weeks always start on Monday, and they won't match user custom weeks starting on Saturday/Sunday.
        A custom week with number N is defined as the one which has the same Monday as ISO week N.
        To get the right week range, we first pick the Monday in the custom week where `date` falls,
        then shift it to the right ISO week. From that ISO week, we build the user custom week.
    */
    const dateInWeek = setISOWeek(setDay(date, 1, { weekStartsOn }), weekNumber);
    const startDateInWeek = startOfWeek(dateInWeek, { weekStartsOn });
    const endDateInWeek = endOfWeek(dateInWeek, { weekStartsOn });
    return [startDateInWeek, endDateInWeek];
};
