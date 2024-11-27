import type { MutableRefObject } from 'react';

import { getIsAutoAddedInvite } from '@proton/shared/lib/calendar/apiModels';
import { getIsOwnedCalendar } from '@proton/shared/lib/calendar/calendar';
import { DAY } from '@proton/shared/lib/constants';
import { fromUTCDateToLocalFakeUTCDate } from '@proton/shared/lib/date/timezone';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import isTruthy from '@proton/utils/isTruthy';

import { generateEventUniqueId } from '../../../helpers/event';
import type { CalendarViewEvent, CalendarViewEventData } from '../interface';
import { getExistingFetch } from './cache/fetchCalendarEvents';
import { getRecurringEvents } from './cache/getRecurringEvents';
import { getIsCalendarEvent } from './cache/helper';
import type { CalendarsEventsCache } from './interface';

interface CalendarEventsProps {
    calendars: VisualCalendar[];
    calendarsEventsCacheRef: MutableRefObject<CalendarsEventsCache>;
    dateRange: [Date, Date];
    tzid: string;
}

export const getCalendarEvents = ({
    calendars,
    calendarsEventsCacheRef,
    dateRange,
    tzid,
}: CalendarEventsProps): CalendarViewEvent[] =>
    calendars
        .map((calendar) => {
            const isOwnedCalendar = getIsOwnedCalendar(calendar);
            const calendarEventsCache = calendarsEventsCacheRef.current?.calendars[calendar.ID];
            if (!calendarEventsCache) {
                return [];
            }

            // If this date range is not contained in the result, we don't return anything because we can't trust the recurring events
            // until we have complete data fetched for this range because of single editions
            const existingFetch = getExistingFetch(dateRange, calendarEventsCache);
            if (!existingFetch || existingFetch.promise) {
                return [];
            }

            // Add a day in both ranges to not miss events due to tz since they are stored in UTC time
            const searchStart = +dateRange[0] - DAY;
            const searchEnd = +dateRange[1] + DAY;

            const results = calendarEventsCache.tree
                .search(searchStart, searchEnd)
                .map(([, , id]): CalendarViewEvent | undefined => {
                    const cachedRecord = calendarEventsCache.events.get(id);
                    if (!cachedRecord) {
                        return;
                    }
                    const { utcStart, utcEnd, eventData, isAllDay, isAllPartDay, eventReadResult } = cachedRecord;

                    const data: CalendarViewEventData = {
                        eventData,
                        eventReadResult,
                        calendarData: calendar,
                    };
                    const isAutoAddedInvite = !!(
                        eventData &&
                        getIsCalendarEvent(eventData) &&
                        getIsAutoAddedInvite(eventData)
                    );

                    if (isAutoAddedInvite && !isOwnedCalendar) {
                        // ignore auto-added invites in shared calendars (they can't be decrypted)
                        return;
                    }

                    return {
                        uniqueId: generateEventUniqueId(calendar.ID, id),
                        isAllDay,
                        isAllPartDay,
                        start: utcStart,
                        end: utcEnd,
                        data,
                    };
                })
                .filter(isTruthy);

            const recurringResults = getRecurringEvents(
                calendarEventsCache.events,
                calendarEventsCache.recurringEvents,
                searchStart,
                searchEnd
            )
                .map(({ id, eventOccurrences, isSingleOccurrence }) => {
                    const cachedRecord = calendarEventsCache.events.get(id);
                    if (!cachedRecord) {
                        return [];
                    }
                    const { eventData, isAllDay, isAllPartDay, eventReadResult } = cachedRecord;

                    const data: CalendarViewEventData = {
                        eventData,
                        eventReadResult,
                        calendarData: calendar,
                    };
                    const isAutoAddedInvite = !!(
                        eventData &&
                        getIsCalendarEvent(eventData) &&
                        getIsAutoAddedInvite(eventData)
                    );

                    if (isAutoAddedInvite && !isOwnedCalendar) {
                        // ignore auto-added invites in shared calendars (they can't be decrypted)
                        return;
                    }

                    return eventOccurrences.map(
                        ({ utcStart, utcEnd, localStart, localEnd, occurrenceNumber }): CalendarViewEvent => {
                            const recurrence = {
                                occurrenceNumber,
                                localStart,
                                localEnd,
                                isSingleOccurrence,
                            };
                            const eventUniqueId = generateEventUniqueId(calendar.ID, id);

                            return {
                                uniqueId: `${eventUniqueId}-${occurrenceNumber}`,
                                isAllDay,
                                isAllPartDay,
                                start: utcStart,
                                end: utcEnd,
                                data: {
                                    ...data,
                                    eventRecurrence: recurrence,
                                },
                            };
                        }
                    );
                })
                .filter(isTruthy)
                .flat(1);

            return results
                .concat(recurringResults)
                .map(({ uniqueId, start: utcStart, end: utcEnd, isAllDay, isAllPartDay, data }): CalendarViewEvent => {
                    const start = fromUTCDateToLocalFakeUTCDate(utcStart, isAllDay, tzid);
                    const end = fromUTCDateToLocalFakeUTCDate(utcEnd, isAllDay, tzid);

                    return {
                        uniqueId,
                        isAllDay: isAllDay || isAllPartDay,
                        isAllPartDay,
                        start,
                        end,
                        data,
                    };
                });
        })
        .flat();
