import { isSameDay, eachDayOfInterval, startOfDay, endOfDay, min, max } from 'proton-shared/lib/date-fns-utc';
import { CalendarViewEvent } from '../../containers/calendar/interface';
import { LayoutEvent } from './layout';

const MIN_DURATION = 30; // In minutes

export const getKey = (date: Date) => {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();

    return `${year}-${month}-${day}`;
};

export const toUTCMinutes = (date: Date) => {
    return date.getUTCHours() * 60 + date.getUTCMinutes();
};

interface SplitTimeGridEventsPerDay {
    events: CalendarViewEvent[];
    min: Date;
    max: Date;
    totalMinutes: number;
}
/**
 * Splits the events per day, all times must be local times.
 */
export const splitTimeGridEventsPerDay = ({
    events = [],
    min: minDate,
    max: maxDate,
    totalMinutes,
}: SplitTimeGridEventsPerDay) => {
    return events.reduce<{ [key: string]: LayoutEvent[] }>((acc, { start, end }, i) => {
        const startDate = startOfDay(max(start, minDate));
        const endDate = endOfDay(min(end, maxDate));

        if (startDate >= endDate) {
            return acc;
        }

        eachDayOfInterval(startDate, endDate).forEach((date) => {
            const key = getKey(date);

            const startTime = isSameDay(date, start) ? toUTCMinutes(start) : 0;
            const endTime = isSameDay(date, end) ? toUTCMinutes(end) : totalMinutes;

            // Special case for part day events that are for example between 1st january 14:00 to 2nd of january 00:00
            // where nothing should be displayed in the 2nd of january
            if (endTime === 0 && !isSameDay(start, end)) {
                return;
            }

            if (!acc[key]) {
                acc[key] = [];
            }

            const startTimeWithMinDuration =
                totalMinutes - startTime < MIN_DURATION ? totalMinutes - MIN_DURATION : startTime;
            const endTimeWithMinDuration =
                endTime - startTimeWithMinDuration < MIN_DURATION ? startTimeWithMinDuration + MIN_DURATION : endTime;

            acc[key].push({ idx: i, start: startTimeWithMinDuration, end: endTimeWithMinDuration });
        });

        return acc;
    }, {});
};
