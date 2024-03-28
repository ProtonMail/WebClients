import { addDays, differenceInCalendarDays, endOfDay, max, min, startOfDay } from '@proton/shared/lib/date-fns-utc';

import { CalendarViewBusyEvent, CalendarViewEvent } from '../../containers/calendar/interface';
import { LayoutEvent } from './layout';

const getEndDate = (end: Date, maxDate: Date, isAllPartDay: boolean) => {
    const endsOnMidnight = +end === +startOfDay(end);
    const minEnd = min(end, maxDate);
    if (isAllPartDay && endsOnMidnight) {
        // for part-day events displayed within range as all-day and ending on midnight, we want to avoid "adding an extra day"
        const endsWithinRange = +minEnd === +end;
        if (endsWithinRange) {
            return endOfDay(addDays(minEnd, -1));
        }
    }
    return endOfDay(minEnd);
};

interface SplitDayEventsInIntervalArguments {
    events: (CalendarViewEvent | CalendarViewBusyEvent)[];
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
        const endDate = getEndDate(end, maxDate, isAllPartDay);

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
