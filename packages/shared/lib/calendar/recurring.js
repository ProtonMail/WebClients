/* eslint-disable no-param-reassign */
import { differenceInMinutes } from 'date-fns';
import { getInternalDateTimeValue, internalValueToIcalValue } from './vcal';
import { isIcalAllDay, propertyToUTCDate } from './vcalConverter';
import { addDays, addMilliseconds, differenceInCalendarDays, MILLISECONDS_IN_MINUTE } from '../date-fns-utc';

const YEAR_IN_MS = Date.UTC(1971, 0, 1);

export const isIcalRecurring = ({ rrule }) => {
    return !!rrule;
};

const isInInterval = (a1, a2, b1, b2) => a1 <= b2 && a2 >= b1;

const fillOccurrencesBetween = (start, end, iterator, eventDuration, internalDtstart, isAllDay) => {
    const result = [];
    let next;

    // eslint-disable-next-line no-cond-assign
    while ((next = iterator.next())) {
        const utcStart = propertyToUTCDate({
            value: {
                ...internalDtstart.value,
                ...getInternalDateTimeValue(next),
                isUTC: internalDtstart.value.isUTC
            },
            parameters: internalDtstart.parameters
        });

        const utcEnd = isAllDay ? addDays(utcStart, eventDuration) : addMilliseconds(utcStart, eventDuration);

        if (utcEnd > end) {
            break;
        }

        if (isInInterval(utcStart, utcEnd, start, end)) {
            result.push([utcStart, utcEnd]);
        }
    }
    return result;
};

export const getOccurencesBetween = (component, start, end, cache = {}) => {
    const { dtstart: internalDtstart, dtend: internalDtEnd, rrule: internalRrule } = component;

    if (!cache.start) {
        const isAllDay = isIcalAllDay(component);
        const dtstartType = isAllDay ? 'date' : 'date-time';

        // Pretend the (local) date is in UTC time to keep the absolute times.
        const dtstart = internalValueToIcalValue(dtstartType, { ...internalDtstart.value, isUTC: true });

        const utcStart = propertyToUTCDate(internalDtstart);
        const utcEnd = propertyToUTCDate(internalDtEnd);

        const eventDuration = isAllDay
            ? differenceInCalendarDays(utcEnd, utcStart)
            : differenceInMinutes(utcEnd, utcStart) * MILLISECONDS_IN_MINUTE;

        cache.start = {
            dtstart,
            utcStart,
            isAllDay,
            eventDuration
        };
    }

    const { eventDuration, isAllDay, utcStart, dtstart } = cache.start;

    // If it starts after the current end, ignore it
    if (utcStart > end) {
        return [];
    }

    if (!cache.iteration || start < cache.iteration.interval[0] || end > cache.iteration.interval[1]) {
        const rrule = internalValueToIcalValue('recur', internalRrule.value);
        const iterator = rrule.iterator(dtstart);

        const interval = [start - YEAR_IN_MS, end + YEAR_IN_MS];

        try {
            const result = fillOccurrencesBetween(
                interval[0],
                interval[1],
                iterator,
                eventDuration,
                internalDtstart,
                isAllDay
            );

            cache.iteration = {
                iterator,
                result,
                interval
            };
        } catch (e) {
            console.error(e);
            // Pretend it was ok
            return [];
        }
    }

    return cache.iteration.result.filter(([eventStart, eventEnd]) => isInInterval(+eventStart, +eventEnd, start, end));
};
