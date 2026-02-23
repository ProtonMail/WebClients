import { getUnixTime, isAfter, isBefore } from 'date-fns';
import { c, msgid } from 'ttag';

import type { ESItem } from '@proton/encrypted-search/models';
import { MAXIMUM_DATE_UTC } from '@proton/shared/lib/calendar/constants';
import type { OccurrenceIterationCache } from '@proton/shared/lib/calendar/recurrence/recurring';
import { getOccurrencesBetween } from '@proton/shared/lib/calendar/recurrence/recurring';
import { propertyToUTCDate } from '@proton/shared/lib/calendar/vcalConverter';
import { DAY, SECOND } from '@proton/shared/lib/constants';
import {
    addDays as addUTCDays,
    addYears as addUTCYears,
    endOfDay as endOfUTCDay,
    format as formatUTC,
    isSameDay as isSameUTCDay,
    startOfDay as startOfUTCDay,
} from '@proton/shared/lib/date-fns-utc';
import { formatIntlUTCDate } from '@proton/shared/lib/date-utc/formatIntlUTCDate';
import { convertTimestampToTimezone, toUTCDate } from '@proton/shared/lib/date/timezone';
import { pick } from '@proton/shared/lib/helpers/object';
import { dateLocale } from '@proton/shared/lib/i18n';
import type { MaybeArray, SimpleMap, UserSettings } from '@proton/shared/lib/interfaces';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import groupWith from '@proton/utils/groupWith';
import isTruthy from '@proton/utils/isTruthy';

import { formatShortTime } from '../../../helpers/date';
import { getEventKey } from '../../../helpers/encryptedSearch/esUtils';
import { generateEventUniqueId } from '../../../helpers/event';
import type { ESCalendarContent, ESCalendarMetadata } from '../../../interfaces/encryptedSearch';
import { getCurrentVevent } from '../eventActions/recurringHelper';
import getComponentFromCalendarEventWithoutBlob from '../eventStore/cache/getComponentFromCalendarEventWithoutBlob';
import type { CalendarsEventsCache } from '../eventStore/interface';
import type { CalendarViewEvent } from '../interface';
import { YEARS_TO_EXPAND_AHEAD } from './constants';
import type { VisualSearchItem } from './interface';

/**
 * Given a UNIX timestamp, convert it into a fake UTC date for a given time zone.
 * I.e. result.getUTC[DateTimeAttribute] should give the date-time attribute of the timestamp localized to that time zone
 */
const getFakeUTCDateFromTimestamp = (timestamp: number, isAllDay: boolean, tzid: string) => {
    return isAllDay ? new Date(timestamp * SECOND) : toUTCDate(convertTimestampToTimezone(timestamp, tzid));
};

const getVisualSearchItem = ({
    item,
    calendarsMap,
    tzid,
    isClosestToDate,
}: {
    item: ESItem<ESCalendarMetadata, ESCalendarContent>;
    calendarsMap: SimpleMap<VisualCalendar>;
    tzid: string;
    isClosestToDate: boolean;
}): VisualSearchItem | undefined => {
    const { CalendarID, StartTime, EndTime, FullDay } = item;
    const calendar = calendarsMap[CalendarID];

    if (!calendar) {
        return;
    }

    const isAllDay = !!FullDay;
    const fakeUTCStartDate = getFakeUTCDateFromTimestamp(StartTime, isAllDay, tzid);
    const fakeUTCEndDate = getFakeUTCDateFromTimestamp(EndTime, isAllDay, tzid);
    const plusDaysToEnd = Math.floor((+endOfUTCDay(fakeUTCEndDate) - +endOfUTCDay(fakeUTCStartDate)) / DAY);

    return {
        ...item,
        isAllDay,
        plusDaysToEnd,
        isClosestToDate,
        visualCalendar: calendar,
        fakeUTCStartDate,
        fakeUTCEndDate,
    };
};

const getClosestToDateIndex = (date: Date, items: ESItem<ESCalendarMetadata, ESCalendarContent>[]) => {
    const dateTimestamp = getUnixTime(date);

    /**
     * Closest event before date
     */
    const lowClosestToDateIndex = items.findLastIndex(
        ({ StartTime, EndTime }) => StartTime <= dateTimestamp || EndTime <= dateTimestamp
    );

    /**
     * Closest event after date
     */
    const highClosestToDateIndex = items.findIndex(
        ({ StartTime, EndTime }) => StartTime >= dateTimestamp || EndTime >= dateTimestamp
    );

    const lowStartTime = items[lowClosestToDateIndex]?.StartTime;
    const highStartTime = items[highClosestToDateIndex]?.StartTime;

    if (!highStartTime) {
        return lowClosestToDateIndex;
    }

    if (!lowStartTime) {
        return highClosestToDateIndex;
    }

    return dateTimestamp - lowStartTime <= dateTimestamp - highStartTime
        ? lowClosestToDateIndex
        : highClosestToDateIndex;
};

export const getVisualSearchItems = ({
    items,
    calendarsMap,
    tzid,
    date,
}: {
    items: ESItem<ESCalendarMetadata, ESCalendarContent>[];
    calendarsMap: SimpleMap<VisualCalendar>;
    tzid: string;
    date: Date;
}) => {
    const closestToDateIndex = getClosestToDateIndex(date, items);

    return items
        .map((item, index) =>
            getVisualSearchItem({ item, calendarsMap, tzid, isClosestToDate: closestToDateIndex === index })
        )
        .filter(isTruthy);
};

export const expandSearchItem = ({
    item,
    date,
    cache = {},
    recurrenceIDs,
}: {
    item: ESItem<ESCalendarMetadata, ESCalendarContent>;
    date: Date;
    cache?: Partial<OccurrenceIterationCache>;
    recurrenceIDs?: number[];
}): MaybeArray<ESItem<ESCalendarMetadata, ESCalendarContent> | undefined> => {
    try {
        if (!item.RRule) {
            return item;
        }
        const component = getComponentFromCalendarEventWithoutBlob(item);

        // we expand three years ahead of passed date, unless it's a yearly event, in which case we expand 20 years ahead
        const yearsToExpand = item.RRule.includes('FREQ=YEARLY')
            ? YEARS_TO_EXPAND_AHEAD.YEARLY
            : YEARS_TO_EXPAND_AHEAD.OTHER;
        const untilDate = addUTCYears(date, yearsToExpand);
        // don't expand beyond the maximum date supported in the calendar
        const cappedUntilTime = Math.min(+untilDate, +MAXIMUM_DATE_UTC);
        const occurrences = getOccurrencesBetween(component, item.StartTime * SECOND, +cappedUntilTime, cache);
        const isSingleOccurrence = occurrences.length === 1;

        return occurrences.map((recurrence) => {
            const { dtstart, dtend } = getCurrentVevent(component, recurrence);

            const { localStart, localEnd, occurrenceNumber } = recurrence;
            const startTime = getUnixTime(propertyToUTCDate(dtstart));

            if (recurrenceIDs?.includes(startTime)) {
                return;
            }

            return {
                ...item,
                StartTime: getUnixTime(propertyToUTCDate(dtstart)),
                EndTime: getUnixTime(propertyToUTCDate(dtend)),
                occurrenceNumber,
                localStart,
                localEnd,
                isSingleOccurrence,
            };
        });
    } catch (e: any) {
        // ignore events that fail to be expanded
        console.warn(e);
    }
};

export const expandAndOrderItems = (
    items: ESItem<ESCalendarMetadata, ESCalendarContent>[],
    calendarsEventsCache: CalendarsEventsCache,
    recurrenceIDsMap: SimpleMap<number[]>,
    date: Date
) => {
    const expanded = items
        .map((item) => {
            const { CalendarID, UID } = item;
            const recurringEvents = calendarsEventsCache.calendars[CalendarID]?.recurringEvents;
            const { cache } = recurringEvents?.get(UID) || {};
            const recurrenceIDs = recurrenceIDsMap[getEventKey(CalendarID, UID)];

            return expandSearchItem({ item, date, cache, recurrenceIDs });
        })
        .flat()
        .filter(isTruthy);

    return expanded.sort(({ StartTime: startA }, { StartTime: startB }) => {
        return startA - startB;
    });
};

export const groupItemsByDay = (items: VisualSearchItem[]) => {
    return groupWith<VisualSearchItem>((a, b) => isSameUTCDay(a.fakeUTCStartDate, b.fakeUTCStartDate), items);
};

export const getCalendarViewEventWithMetadata = (item: VisualSearchItem): CalendarViewEvent => {
    const {
        CalendarID,
        ID,
        visualCalendar,
        fakeUTCStartDate,
        fakeUTCEndDate,
        isAllDay,
        occurrenceNumber,
        localStart,
        localEnd,
        isSingleOccurrence,
    } = item;

    const result: CalendarViewEvent = {
        uniqueId: generateEventUniqueId(CalendarID, ID),
        start: fakeUTCStartDate,
        end: isAllDay ? addUTCDays(fakeUTCEndDate, -1) : fakeUTCEndDate,
        isAllDay,
        isAllPartDay: false,
        data: {
            calendarData: visualCalendar,
            eventData: pick(item, [
                'ID',
                'SharedEventID',
                'CalendarID',
                'CreateTime',
                'ModifyTime',
                'Permissions',
                'IsOrganizer',
                'IsProtonProtonInvite',
                'IsPersonalSingleEdit',
                'Author',
                'Color',
            ]),
        },
    };

    if (
        occurrenceNumber !== undefined &&
        localStart !== undefined &&
        localEnd !== undefined &&
        isSingleOccurrence !== undefined
    ) {
        result.data.eventRecurrence = {
            occurrenceNumber,
            localStart,
            localEnd,
            isSingleOccurrence,
        };
    }

    return result;
};

export const getTimeString = ({
    startDate,
    endDate,
    isAllDay,
    plusDaysToEnd,
    userSettings,
}: {
    startDate: Date;
    endDate: Date;
    isAllDay: boolean;
    plusDaysToEnd: number;
    userSettings: UserSettings;
}) => {
    if (isAllDay) {
        if (plusDaysToEnd <= 1) {
            return c('Event info in search view; event duration').t`All day`;
        }

        // translator: the variable plusDaysToEnd is a numeric value for the duration of the event in days
        return c('Event info in search view; event duration').ngettext(
            msgid`All day, lasts ${plusDaysToEnd} day`,
            `All day, lasts ${plusDaysToEnd} days`,
            plusDaysToEnd
        );
    }

    const formattedStartTime = formatShortTime(startDate, userSettings);
    const formattedEndTime = formatShortTime(endDate, userSettings);

    return plusDaysToEnd === 0
        ? `${formattedStartTime} - ${formattedEndTime}`
        : `${formattedStartTime} - ${formattedEndTime} (+${plusDaysToEnd})`;
};

export const getEventsDayDateString = (date: Date) => {
    const formattedMonthYear = formatIntlUTCDate(date, {
        month: 'short',
        year: 'numeric',
    });
    const shortWeekDay = formatUTC(date, 'ccc', {
        locale: dateLocale,
    });
    return `${shortWeekDay}, ${formattedMonthYear}`;
};

/**
 * Used to know in which position append empty today, returns either 0 or 1:
 *
 * - 0: empty today should not be displayed (because there are events today)
 * - 1: empty today should be placed after current day (either because today is between current & next day or there is no next day)
 */
const getEmptyTodayPosition = ({
    currentStartDate,
    nextStartDate,
    now,
}: {
    currentStartDate: Date;
    now: Date;
    nextStartDate?: Date;
}): number => {
    return +Boolean(
        isAfter(startOfUTCDay(now), startOfUTCDay(currentStartDate)) &&
        nextStartDate &&
        isBefore(startOfUTCDay(now), startOfUTCDay(nextStartDate))
    );
};

/**
 * If `today` has no event, we'll add an empty group
 */
export const fillEmptyToday = (eventsGroupedByDay: VisualSearchItem[][], now: Date) => {
    return eventsGroupedByDay.reduce((acc: VisualSearchItem[][], currentDayEvents, index) => {
        const [{ fakeUTCStartDate }] = eventsGroupedByDay[index];
        const nextDailyEvents = eventsGroupedByDay[index + 1];

        const emptyTodayPosition = getEmptyTodayPosition({
            currentStartDate: fakeUTCStartDate,
            nextStartDate: nextDailyEvents?.[0]?.fakeUTCStartDate,
            now,
        });

        const withMaybeEmptyToday = [currentDayEvents];

        if (emptyTodayPosition === -1) {
            withMaybeEmptyToday.unshift([]);
        } else if (emptyTodayPosition === 1) {
            withMaybeEmptyToday.push([]);
        }

        return [...acc, ...withMaybeEmptyToday];
    }, []);
};
