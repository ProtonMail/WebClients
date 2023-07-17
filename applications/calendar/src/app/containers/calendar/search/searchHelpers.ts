import { getUnixTime, isAfter, isBefore, startOfDay } from 'date-fns';
import { c } from 'ttag';

import { ESItem } from '@proton/encrypted-search/lib';
import { OccurrenceIterationCache, getOccurrences } from '@proton/shared/lib/calendar/recurrence/recurring';
import { propertyToUTCDate } from '@proton/shared/lib/calendar/vcalConverter';
import { DAY, SECOND } from '@proton/shared/lib/constants';
import { endOfDay, format as formatUTC, isSameDay as isSameUTCDay } from '@proton/shared/lib/date-fns-utc';
import { formatIntlUTCDate } from '@proton/shared/lib/date-utc/formatIntlUTCDate';
import { convertTimestampToTimezone, toUTCDate } from '@proton/shared/lib/date/timezone';
import { pick } from '@proton/shared/lib/helpers/object';
import { dateLocale } from '@proton/shared/lib/i18n';
import { MaybeArray, SimpleMap } from '@proton/shared/lib/interfaces';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import groupWith from '@proton/utils/groupWith';
import isTruthy from '@proton/utils/isTruthy';

import { ESCalendarMetadata, ESCalendarContent } from '../../../interfaces/encryptedSearch';
import { getCurrentEvent } from '../eventActions/recurringHelper';
import getComponentFromCalendarEventWithoutBlob from '../eventStore/cache/getComponentFromCalendarEventWithoutBlob';
import { CalendarsEventsCache } from '../eventStore/interface';
import { CalendarViewEvent } from '../interface';
import { VisualSearchItem } from './interface';

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
}: {
    item: ESItem<ESCalendarMetadata, ESCalendarContent>;
    calendarsMap: SimpleMap<VisualCalendar>;
    tzid: string;
}): VisualSearchItem | undefined => {
    const { CalendarID, StartTime, EndTime, FullDay } = item;
    const calendar = calendarsMap[CalendarID];

    if (!calendar) {
        return;
    }

    const isAllDay = !!FullDay;
    const fakeUTCStartDate = getFakeUTCDateFromTimestamp(StartTime, isAllDay, tzid);
    const fakeUTCEndDate = getFakeUTCDateFromTimestamp(EndTime, isAllDay, tzid);
    const plusDaysToEnd = Math.floor((+endOfDay(fakeUTCEndDate) - +endOfDay(fakeUTCStartDate)) / DAY);

    return {
        ...item,
        isAllDay,
        plusDaysToEnd,
        visualCalendar: calendar,
        fakeUTCStartDate,
        fakeUTCEndDate,
        isFirst: false,
    };
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
    const visualItems = items.map((item) => getVisualSearchItem({ item, calendarsMap, tzid })).filter(isTruthy);
    const dateTimestamp = getUnixTime(date);
    const firstIndex = visualItems.findIndex(
        ({ StartTime, EndTime }) => StartTime >= dateTimestamp || EndTime >= dateTimestamp
    );

    const totalItems = visualItems.length;
    if (firstIndex === -1) {
        if (totalItems) {
            // set last element in the list as first
            visualItems[totalItems - 1].isFirst = true;
        }
    } else {
        visualItems[firstIndex].isFirst = true;
    }

    return visualItems;
};

const expandSearchItem = (
    item: ESItem<ESCalendarMetadata, ESCalendarContent>,
    cache: Partial<OccurrenceIterationCache> = {}
): MaybeArray<ESItem<ESCalendarMetadata, ESCalendarContent>> => {
    if (!item.RRule) {
        return item;
    }
    const component = getComponentFromCalendarEventWithoutBlob(item);

    return getOccurrences({ component, maxCount: 500, cache }).map((recurrence) => {
        const { dtstart, dtend } = getCurrentEvent(component, recurrence);

        const { localStart, localEnd, occurrenceNumber } = recurrence;

        return {
            ...item,
            StartTime: getUnixTime(propertyToUTCDate(dtstart)),
            EndTime: getUnixTime(propertyToUTCDate(dtend)),
            occurrenceNumber,
            localStart,
            localEnd,
            // TODO: treat single edits
            isSingleOccurrence: false,
        };
    });
};

export const expandAndOrderItems = (
    items: ESItem<ESCalendarMetadata, ESCalendarContent>[],
    calendarsEventsCache: CalendarsEventsCache
) => {
    const expanded = items
        .map((item) => {
            const recurringEvents = calendarsEventsCache.calendars[item.CalendarID]?.recurringEvents;
            const { cache } = recurringEvents?.get(item.UID) || {};

            return expandSearchItem(item, cache);
        })
        .flat();

    return expanded.sort(({ StartTime: startA }, { StartTime: startB }) => {
        return startA - startB;
    });
};

export const groupItemsByDay = (items: VisualSearchItem[]) => {
    return groupWith<VisualSearchItem>((a, b) => isSameUTCDay(a.fakeUTCStartDate, b.fakeUTCStartDate), items);
};

export const getCalendarViewEventWithMetadata = (item: VisualSearchItem): CalendarViewEvent => {
    const {
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
        id: ID,
        start: fakeUTCStartDate,
        end: fakeUTCEndDate,
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
                'Author',
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
}: {
    startDate: Date;
    endDate: Date;
    isAllDay: boolean;
    plusDaysToEnd: number;
}) => {
    if (isAllDay) {
        if (plusDaysToEnd <= 1) {
            return c('Event info in search view; event duration').t`All day`;
        }

        // translator: the variable plusDaysToEnd is a numeric value for the duration of the event in days
        return c('Event info in search view; event duration').t`All day, lasts ${plusDaysToEnd} days`;
    }

    const formattedStartTime = formatUTC(startDate, 'p', { locale: dateLocale });
    const formattedEndTime = formatUTC(endDate, 'p', { locale: dateLocale });

    return plusDaysToEnd === 0
        ? `${formattedStartTime} - ${formattedEndTime}`
        : `${formattedStartTime} - ${formattedEndTime} (+${plusDaysToEnd})`;
};

export const getEventsDayDateString = (date: Date) => {
    const formattedMonthYear = formatIntlUTCDate(date, {
        month: 'short',
        year: 'numeric',
    });
    const shortWeekDay = formatUTC(date, 'ccc');
    return `${shortWeekDay}, ${formattedMonthYear}`;
};

/**
 * Used to know in which position append empty today, returns either -1, 0 or 1:
 *
 * - -1: empty today should be placed before current day (used only when today is before first event)
 * - 0: empty today should not be displayed (because there are events today)
 * - 1: empty today should be placed after current day (either because today is between current & next day or there is simply no next day)
 */
const getEmptyTodayPosition = ({
    currentStartDate,
    nextStartDate,
    today,
    isFirstDay,
}: {
    currentStartDate: Date;
    today: Date;
    nextStartDate?: Date;
    isFirstDay: boolean;
}) => {
    switch (true) {
        case isFirstDay && isBefore(today, startOfDay(currentStartDate)):
            return -1;
        case isAfter(today, startOfDay(currentStartDate)) &&
            (!nextStartDate || isBefore(today, startOfDay(nextStartDate))):
            return 1;
        default:
            return 0;
    }
};

/**
 * If `today` has no event, we'll add an empty group
 */
export const fillEmptyToday = (eventsGroupedByDay: VisualSearchItem[][]) => {
    const today = startOfDay(new Date());
    return eventsGroupedByDay.reduce((acc: VisualSearchItem[][], currentDayEvents, index) => {
        const [{ fakeUTCStartDate }] = eventsGroupedByDay[index];
        const nextDailyEvents = eventsGroupedByDay[index + 1];

        const emptyTodayPosition = getEmptyTodayPosition({
            currentStartDate: fakeUTCStartDate,
            nextStartDate: nextDailyEvents?.[0]?.fakeUTCStartDate,
            isFirstDay: index === 0,
            today,
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
