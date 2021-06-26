import { useEffect, useState, useMemo, MutableRefObject } from 'react';
import { fromUTCDate, toUTCDate, convertUTCDateTimeToZone } from '@proton/shared/lib/date/timezone';
import { Calendar as tsCalendar } from '@proton/shared/lib/interfaces/calendar';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { getRecurringEvents } from './cache/getRecurringEvents';
import { CalendarsEventsCache } from './interface';
import { CalendarViewEvent, CalendarViewEventData } from '../interface';
import { getExistingFetch } from './cache/fetchCalendarEvents';
import useCalendarsEventsFetcher from './useCalendarsEventsFetcher';
import useCalendarsEventsReader from './useCalendarsEventsReader';

const DAY_IN_MILLISECONDS = 86400000;

const useCalendarsEvents = (
    requestedCalendars: tsCalendar[],
    utcDateRange: [Date, Date],
    tzid: string,
    cacheRef: MutableRefObject<CalendarsEventsCache>
): [CalendarViewEvent[], boolean] => {
    const [rerender, setRerender] = useState<any>();
    const loading = useCalendarsEventsFetcher(requestedCalendars, utcDateRange, tzid, cacheRef);

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
            .map((Calendar) => {
                const { ID } = Calendar;
                const calendarEventsCache = cacheRef.current?.calendars[ID];
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
                const searchStart = +utcDateRange[0] - DAY_IN_MILLISECONDS;
                const searchEnd = +utcDateRange[1] + DAY_IN_MILLISECONDS;

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
                            calendarData: Calendar,
                        };

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
                            calendarData: Calendar,
                        };

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
                    .flat(1);

                return results
                    .concat(recurringResults)
                    .map(({ start: utcStart, end: utcEnd, isAllDay, isAllPartDay, data, id }): CalendarViewEvent => {
                        const start = isAllDay
                            ? utcStart
                            : toUTCDate(convertUTCDateTimeToZone(fromUTCDate(utcStart), tzid));
                        const end = isAllDay ? utcEnd : toUTCDate(convertUTCDateTimeToZone(fromUTCDate(utcEnd), tzid));

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

    useCalendarsEventsReader(eventsResults, cacheRef, () => setRerender({}));

    return [eventsResults, loading];
};

export default useCalendarsEvents;
