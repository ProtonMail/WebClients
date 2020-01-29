/* eslint-disable no-param-reassign */
import { differenceInMinutes } from 'date-fns';
import { getInternalDateTimeValue, internalValueToIcalValue } from './vcal';
import { getPropertyTzid, isIcalAllDay, propertyToUTCDate } from './vcalConverter';
import { addDays, addMilliseconds, differenceInCalendarDays, max, MILLISECONDS_IN_MINUTE } from '../date-fns-utc';
import { convertUTCDateTimeToZone, fromUTCDate, toUTCDate } from '../date/timezone';

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
        const localStart = toUTCDate(getInternalDateTimeValue(next));

        const utcStart = propertyToUTCDate({
            value: {
                ...internalDtstart.value,
                ...fromUTCDate(localStart)
            },
            parameters: internalDtstart.parameters
        });

        const utcEnd = isAllDay
            ? addDays(utcStart, eventDuration)
            : propertyToUTCDate({
                  value: {
                      ...internalDtstart.value,
                      ...fromUTCDate(addMilliseconds(localStart, eventDuration))
                  },
                  parameters: internalDtstart.parameters
              });

        if (utcStart > end) {
            break;
        }

        if (isInInterval(utcStart, utcEnd, start, end)) {
            result.push([utcStart, utcEnd]);
        }
    }
    return result;
};

/**
 * Convert the until property of an rrule to be in the timezone of the start date
 */
const getModifiedUntilRrule = (internalRrule, startTzid) => {
    if (!internalRrule || !internalRrule.value || !internalRrule.value.until || !startTzid) {
        return internalRrule;
    }
    const utcUntil = toUTCDate(internalRrule.value.until);
    const localUntil = convertUTCDateTimeToZone(fromUTCDate(utcUntil), startTzid);
    return {
        ...internalRrule,
        value: {
            ...internalRrule.value,
            until: {
                ...localUntil,
                isUTC: true
            }
        }
    };
};

export const getOccurencesBetween = (component, start, end, cache = {}) => {
    const { dtstart: internalDtstart, dtend: internalDtEnd, rrule: internalRrule } = component;

    if (!cache.start) {
        const isAllDay = isIcalAllDay(component);
        const dtstartType = isAllDay ? 'date' : 'date-time';

        // Pretend the (local) date is in UTC time to keep the absolute times.
        const dtstart = internalValueToIcalValue(dtstartType, { ...internalDtstart.value, isUTC: true });
        // Since the local date is pretended in UTC time, the until has to be converted into a fake local UTC time too
        const modifiedRrule = getModifiedUntilRrule(internalRrule, getPropertyTzid(internalDtstart));

        const utcStart = propertyToUTCDate(internalDtstart);
        const rawEnd = propertyToUTCDate(internalDtEnd);
        const modifiedEnd = isAllDay
            ? addDays(rawEnd, -1) // All day event range is non-inclusive
            : rawEnd;
        const utcEnd = max(utcStart, modifiedEnd);

        const eventDuration = isAllDay
            ? differenceInCalendarDays(utcEnd, utcStart)
            : differenceInMinutes(utcEnd, utcStart) * MILLISECONDS_IN_MINUTE;

        cache.start = {
            dtstart,
            utcStart,
            isAllDay,
            eventDuration,
            modifiedRrule
        };
    }

    const { eventDuration, isAllDay, utcStart, dtstart, modifiedRrule } = cache.start;

    // If it starts after the current end, ignore it
    if (utcStart > end) {
        return [];
    }

    if (!cache.iteration || start < cache.iteration.interval[0] || end > cache.iteration.interval[1]) {
        const rrule = internalValueToIcalValue('recur', modifiedRrule.value);
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
