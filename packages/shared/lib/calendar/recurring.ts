/* eslint-disable no-param-reassign */
import { getInternalDateTimeValue, internalValueToIcalValue } from './vcal';
import { getDtendProperty, propertyToUTCDate } from './vcalConverter';
import { getIsAllDay, getPropertyTzid } from './vcalHelper';
import { addDays, addMilliseconds, differenceInCalendarDays, max } from '../date-fns-utc';
import { convertUTCDateTimeToZone, convertZonedDateTimeToUTC, fromUTCDate, toUTCDate } from '../date/timezone';
import { createExdateMap } from './exdate';
import {
    VcalDateOrDateTimeProperty,
    VcalDateOrDateTimeValue,
    VcalRruleProperty,
    VcalVeventComponent,
} from '../interfaces/calendar/VcalModel';

interface CacheInner {
    dtstart: VcalDateOrDateTimeValue;
    utcStart: Date;
    isAllDay: boolean;
    eventDuration: number;
    modifiedRrule: VcalRruleProperty;
    exdateMap: { [key: number]: boolean };
}

export interface RecurringResult {
    localStart: Date;
    localEnd: Date;
    utcStart: Date;
    utcEnd: Date;
    occurrenceNumber: number;
}

export interface OccurrenceIterationCache {
    start: CacheInner;
    iteration: {
        iterator: any;
        result: RecurringResult[];
        interval: number[];
    };
}

type RequiredVcalVeventComponent = Pick<VcalVeventComponent, 'dtstart' | 'rrule' | 'exdate'>;

const YEAR_IN_MS = Date.UTC(1971, 0, 1);

const isInInterval = (a1: number, a2: number, b1: number, b2: number) => a1 <= b2 && a2 >= b1;

// Special case for when attempting to use occurrences when an rrule does not exist.
// Fake an rrule so that the iteration goes through at least once
const DEFAULT_RRULE = {
    value: {
        freq: 'DAILY',
        count: 1,
    },
};

interface FillOccurrencesBetween {
    interval: number[];
    iterator: any;
    eventDuration: number;
    originalDtstart: VcalDateOrDateTimeProperty;
    originalDtend: VcalDateOrDateTimeProperty;
    isAllDay: boolean;
    exdateMap: { [key: number]: boolean };
}
const fillOccurrencesBetween = ({
    interval: [start, end],
    iterator,
    eventDuration,
    originalDtstart,
    originalDtend,
    isAllDay,
    exdateMap,
}: FillOccurrencesBetween) => {
    const result = [];
    let next;

    const startTzid = getPropertyTzid(originalDtstart);
    const endTzid = getPropertyTzid(originalDtend);

    // eslint-disable-next-line no-cond-assign
    while ((next = iterator.next())) {
        const localStart = toUTCDate(getInternalDateTimeValue(next));
        if (exdateMap[+localStart]) {
            continue;
        }

        let localEnd;
        let utcStart;
        let utcEnd;

        if (isAllDay) {
            localEnd = addDays(localStart, eventDuration);
            utcStart = localStart;
            utcEnd = localEnd;
        } else if (!startTzid || !endTzid) {
            const endInStartTimezone = addMilliseconds(localStart, eventDuration);
            localEnd = endInStartTimezone;
            utcStart = localStart;
            utcEnd = endInStartTimezone;
        } else {
            const endInStartTimezone = addMilliseconds(localStart, eventDuration);

            const endInUTC = convertZonedDateTimeToUTC(fromUTCDate(endInStartTimezone), startTzid);
            localEnd = toUTCDate(convertUTCDateTimeToZone(endInUTC, endTzid));

            utcStart = toUTCDate(convertZonedDateTimeToUTC(fromUTCDate(localStart), startTzid));
            utcEnd = toUTCDate(endInUTC);
        }

        if (+utcStart > end) {
            break;
        }

        if (isInInterval(+utcStart, +utcEnd, start, end)) {
            result.push({
                localStart,
                localEnd,
                utcStart,
                utcEnd,
                occurrenceNumber: iterator.occurrence_number as number,
            });
        }
    }
    return result;
};

/**
 * Convert the until property of an rrule to be in the timezone of the start date
 */
const getModifiedUntilRrule = (internalRrule: VcalRruleProperty, startTzid: string | undefined): VcalRruleProperty => {
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
                isUTC: true,
            },
        },
    };
};

const getOccurrenceSetup = (component: RequiredVcalVeventComponent) => {
    const { dtstart: internalDtstart, rrule: internalRrule, exdate: internalExdate } = component;
    const internalDtEnd = getDtendProperty(component);

    const isAllDay = getIsAllDay(component);
    const dtstartType = isAllDay ? 'date' : 'date-time';

    // Pretend the (local) date is in UTC time to keep the absolute times.
    const dtstart = internalValueToIcalValue(dtstartType, {
        ...internalDtstart.value,
        isUTC: true,
    }) as VcalDateOrDateTimeValue;
    // Since the local date is pretended in UTC time, the until has to be converted into a fake local UTC time too
    const safeRrule = getModifiedUntilRrule(internalRrule || DEFAULT_RRULE, getPropertyTzid(internalDtstart));

    const utcStart = propertyToUTCDate(internalDtstart);
    let eventDuration: number;

    if (isAllDay) {
        const rawEnd = propertyToUTCDate(internalDtEnd);
        // Non-inclusive end...
        const modifiedEnd = addDays(rawEnd, -1);
        const utcEnd = max(utcStart, modifiedEnd);

        eventDuration = differenceInCalendarDays(utcEnd, utcStart);
    } else {
        const utcStart = propertyToUTCDate(internalDtstart);
        const utcEnd = propertyToUTCDate(internalDtEnd);

        eventDuration = Math.max(+utcEnd - +utcStart, 0);
    }

    return {
        dtstart,
        utcStart,
        isAllDay,
        eventDuration,
        modifiedRrule: safeRrule,
        exdateMap: createExdateMap(internalExdate),
    };
};

interface GetOccurrences {
    component: RequiredVcalVeventComponent;
    maxStart?: Date;
    maxCount?: number;
    cache?: Partial<OccurrenceIterationCache>;
}
export const getOccurrences = ({
    component,
    maxStart = new Date(9999, 0, 1),
    maxCount = 1,
    cache = {},
}: GetOccurrences) => {
    if (maxCount <= 0) {
        return [];
    }

    if (!cache.start) {
        cache.start = getOccurrenceSetup(component);
    }

    const { eventDuration, isAllDay, dtstart, modifiedRrule, exdateMap } = cache.start;

    const rrule = internalValueToIcalValue('recur', modifiedRrule.value);
    const iterator = rrule.iterator(dtstart);
    const result = [];

    let next;
    // eslint-disable-next-line no-cond-assign
    while ((next = iterator.next())) {
        const localStart = toUTCDate(getInternalDateTimeValue(next));
        if (exdateMap[+localStart]) {
            continue;
        }
        if (result.length >= maxCount || localStart >= maxStart) {
            break;
        }
        const localEnd = isAllDay ? addDays(localStart, eventDuration) : addMilliseconds(localStart, eventDuration);
        result.push({
            localStart,
            localEnd,
            occurrenceNumber: iterator.occurrence_number,
        });
    }
    return result;
};

export const getOccurrencesBetween = (
    component: Pick<VcalVeventComponent, 'dtstart' | 'rrule' | 'exdate'>,
    start: number,
    end: number,
    cache: Partial<OccurrenceIterationCache> = {}
): RecurringResult[] => {
    if (!cache.start) {
        cache.start = getOccurrenceSetup(component);
    }

    const originalDtstart = component.dtstart;
    const originalDtend = getDtendProperty(component);

    const { eventDuration, isAllDay, utcStart, dtstart, modifiedRrule, exdateMap } = cache.start;

    // If it starts after the current end, ignore it
    if (+utcStart > end) {
        return [];
    }

    if (!cache.iteration || start < cache.iteration.interval[0] || end > cache.iteration.interval[1]) {
        const rrule = internalValueToIcalValue('recur', modifiedRrule.value);
        const iterator = rrule.iterator(dtstart);

        const interval = [start - YEAR_IN_MS, end + YEAR_IN_MS];

        try {
            const result = fillOccurrencesBetween({
                interval,
                iterator,
                eventDuration,
                originalDtstart,
                originalDtend,
                isAllDay,
                exdateMap,
            });

            cache.iteration = {
                iterator,
                result,
                interval,
            };
        } catch (e) {
            console.error(e);
            // Pretend it was ok
            return [];
        }
    }

    return cache.iteration.result.filter(({ utcStart, utcEnd }) => isInInterval(+utcStart, +utcEnd, start, end));
};
