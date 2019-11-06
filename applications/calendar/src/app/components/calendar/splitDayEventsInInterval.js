import { differenceInCalendarDays, startOfDay, endOfDay, min, max } from 'proton-shared/lib/date-fns-utc';

export const splitDayEventsInInterval = ({ events = [], min: minDate, max: maxDate }) => {
    return events.reduce((acc, { start, end }, i) => {
        const startDate = startOfDay(max(start, minDate));
        const endDate = endOfDay(min(end, maxDate));

        if (startDate >= endDate) {
            return acc;
        }

        const calendarDaysDifference = differenceInCalendarDays(endDate, startDate);
        const startIndex = differenceInCalendarDays(startDate, minDate);

        acc.push({
            idx: i,
            start: startIndex,
            end: startIndex + calendarDaysDifference + 1
        });

        return acc;
    }, []);
};
