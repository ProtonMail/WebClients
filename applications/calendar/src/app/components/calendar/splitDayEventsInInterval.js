import { differenceInCalendarDays, startOfDay, endOfDay, min, max } from 'proton-shared/lib/date-fns-utc';

export const splitDayEventsInInterval = ({ events = [], min: minDate, max: maxDate }) => {
    return events.reduce((acc, { start, end, isAllDay, isAllPartDay }, i) => {
        const startDate = startOfDay(max(start, minDate));
        const endDate = endOfDay(min(end, maxDate));

        if (startDate >= endDate) {
            return acc;
        }

        // For part day events, lock it into one day even if it happens to span multiple days, but not considered an all day part event.
        const calendarDaysDifference = isAllDay || isAllPartDay ? differenceInCalendarDays(endDate, startDate) : 0;
        const startIndex = differenceInCalendarDays(startDate, minDate);

        acc.push({
            idx: i,
            start: startIndex,
            end: startIndex + calendarDaysDifference + 1
        });

        return acc;
    }, []);
};
