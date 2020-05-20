import { differenceInCalendarDays, startOfDay, endOfDay, min, max } from 'proton-shared/lib/date-fns-utc';
import { CalendarViewEvent } from '../../containers/calendar/interface';
import { LayoutEvent } from './layout';

interface SplitDayEventsInIntervalArguments {
    events: CalendarViewEvent[];
    min: Date;
    max: Date;
}
export const splitDayEventsInInterval = ({
    events = [],
    min: minDate,
    max: maxDate,
}: SplitDayEventsInIntervalArguments) => {
    return events.reduce<LayoutEvent[]>((acc, { start, end, isAllDay, isAllPartDay }, i) => {
        const startDate = startOfDay(max(start, minDate));
        const endDate = endOfDay(min(end, maxDate));

        const isDisplayedMultipleDays = isAllDay || isAllPartDay;

        if (startDate >= endDate) {
            return acc;
        }

        // Part day events that are not displayed as all day events that start before the date range, are already displayed in a previous row.
        if (!isDisplayedMultipleDays && startDate > start) {
            return acc;
        }

        const calendarDaysDifference = isDisplayedMultipleDays ? differenceInCalendarDays(endDate, startDate) : 0;
        const startIndex = differenceInCalendarDays(startDate, minDate);

        acc.push({
            idx: i,
            start: startIndex,
            end: startIndex + calendarDaysDifference + 1,
        });

        return acc;
    }, []);
};
