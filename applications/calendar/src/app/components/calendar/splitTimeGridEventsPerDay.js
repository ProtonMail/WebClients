import { isSameDay, eachDayOfInterval, startOfDay, endOfDay, min, max } from 'proton-shared/lib/date-fns-utc';

export const getKey = (date) => {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();

    return `${year}-${month}-${day}`;
};

export const toUTCMinutes = (date) => {
    return date.getUTCHours() * 60 + date.getUTCMinutes();
};

/**
 * Splits the events per day, all times must be local times.
 * @param {Array} events
 * @param {Date} min
 * @param {Date} max
 * @param {Number} totalMinutes
 * @return {*}
 */
export const splitTimeGridEventsPerDay = ({ events = [], min: minDate, max: maxDate, totalMinutes }) => {
    return events.reduce((acc, { start, end }, i) => {
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

            acc[key].push({ idx: i, start: startTime, end: endTime });
        });

        return acc;
    }, {});
};
