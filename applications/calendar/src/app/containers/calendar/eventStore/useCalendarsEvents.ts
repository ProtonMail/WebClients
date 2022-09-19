import { MutableRefObject, useEffect, useMemo, useState } from 'react';

import { getIsOwnedCalendar } from '@proton/shared/lib/calendar/calendar';
import { DAY } from '@proton/shared/lib/constants';
import { fromUTCDateToLocalFakeUTCDate } from '@proton/shared/lib/date/timezone';
import { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import isTruthy from '@proton/utils/isTruthy';

import { OpenedMailEvent } from '../../../hooks/useGetOpenedMailEvents';
import { CalendarViewEvent, CalendarViewEventData } from '../interface';
import { getExistingFetch } from './cache/fetchCalendarEvents';
import { getRecurringEvents } from './cache/getRecurringEvents';
import { getIsCalendarEvent } from './cache/helper';
import { CalendarsEventsCache } from './interface';
import useCalendarsEventsFetcher from './useCalendarsEventsFetcher';
import useCalendarsEventsReader from './useCalendarsEventsReader';

const useCalendarsEvents = (
    requestedCalendars: VisualCalendar[],
    utcDateRange: [Date, Date],
    tzid: string,
    cacheRef: MutableRefObject<CalendarsEventsCache>,
    getOpenedMailEvents: () => OpenedMailEvent[],
    initializeCacheOnlyCalendarsIDs: string[],
    onCacheInitialized: () => void
): [CalendarViewEvent[], boolean] => {
    const [rerender, setRerender] = useState<any>();
    const loading = useCalendarsEventsFetcher(
        requestedCalendars,
        utcDateRange,
        tzid,
        cacheRef,
        getOpenedMailEvents,
        initializeCacheOnlyCalendarsIDs,
        onCacheInitialized
    );

    useEffect(() => {
        let isActive = true;
        cacheRef.current.rerender = () => {
            if (isActive) {
                setRerender({});
            }
        };
        return () => {
            cacheRef.current.rerender = undefined;
            isActive = false;
        };
    }, []);

    const eventsResults = useMemo((): CalendarViewEvent[] => {
        return requestedCalendars
            .map((calendar) => {
                const isOwnedCalendar = getIsOwnedCalendar(calendar);
                const calendarEventsCache = cacheRef.current?.calendars[calendar.ID];
                if (!calendarEventsCache) {
                    return [];
                }

                // If this date range is not contained in the result, we don't return anything because we can't trust the recurring events
                // until we have complete data fetched for this range because of single editions
                const existingFetch = getExistingFetch(utcDateRange, calendarEventsCache);
                if (!existingFetch || existingFetch.promise) {
                    return [];
                }

                // Add a day in both ranges to not miss events due to tz since they are stored in UTC time
                const searchStart = +utcDateRange[0] - DAY;
                const searchEnd = +utcDateRange[1] + DAY;

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
                        const hasAddressKeyPacket = !!(
                            eventData &&
                            getIsCalendarEvent(eventData) &&
                            eventData.AddressKeyPacket
                        );

                        if (hasAddressKeyPacket && !isOwnedCalendar) {
                            // ignore auto-added invites in shared calendars (they can't be decrypted)
                            return;
                        }

                        return {
                            id,
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
                        const hasAddressKeyPacket = !!(
                            eventData &&
                            getIsCalendarEvent(eventData) &&
                            eventData.AddressKeyPacket
                        );

                        if (hasAddressKeyPacket && !isOwnedCalendar) {
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
                                return {
                                    id: `${id}-${occurrenceNumber}`,
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
                    .map(({ start: utcStart, end: utcEnd, isAllDay, isAllPartDay, data, id }): CalendarViewEvent => {
                        const start = fromUTCDateToLocalFakeUTCDate(utcStart, isAllDay, tzid);
                        const end = fromUTCDateToLocalFakeUTCDate(utcEnd, isAllDay, tzid);

                        return {
                            id,
                            isAllDay: isAllDay || isAllPartDay,
                            isAllPartDay,
                            start,
                            end,
                            data,
                        };
                    });
            })
            .flat();
    }, [rerender, loading, tzid, requestedCalendars, utcDateRange]);

    useCalendarsEventsReader(eventsResults, cacheRef, () => setRerender({}), getOpenedMailEvents);

    return [eventsResults, loading];
};

export default useCalendarsEvents;
