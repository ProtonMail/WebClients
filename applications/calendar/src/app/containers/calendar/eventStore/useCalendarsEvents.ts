import { useEffect, useState, useMemo, useCallback, MutableRefObject } from 'react';
import { useApi } from 'react-components';
import createIntervalTree from 'interval-tree';
import { fromUTCDate, toUTCDate, convertUTCDateTimeToZone } from 'proton-shared/lib/date/timezone';
import { Calendar as tsCalendar, CalendarEvent } from 'proton-shared/lib/interfaces/calendar';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import useGetCalendarEventRaw from './useGetCalendarEventRaw';
import useGetCalendarEventPersonal from './useGetCalendarEventPersonal';
import { setEventInCache } from './cache/cache';
import getPaginatedEvents from './getPaginatedEvents';
import { getRecurringEvents } from './cache/getRecurringEvents';
import { CalendarsEventsCache, DecryptedEventRecord, DecryptedTupleResult } from './interface';
import { CalendarViewEvent } from '../interface';

const DAY_IN_MILLISECONDS = 86400000;

const contains = (range: Date[], otherRanges: Date[][]) => {
    return otherRanges.some((otherRange) => {
        return otherRange && +otherRange[1] >= +range[1] && +otherRange[0] <= +range[0];
    });
};

export const getInitialCalendarEventCache = () => {
    return {
        ref: 0,
        isUnmounted: false,
        calendars: {}
    };
};

const useCalendarsEvents = (
    requestedCalendars: tsCalendar[],
    utcDateRange: Date[],
    tzid: string,
    cacheRef: MutableRefObject<CalendarsEventsCache>
) => {
    const [loading, setLoading] = useState(false);
    const [rerender, setRerender] = useState<any>();
    const api = useApi();

    const getEventRaw = useGetCalendarEventRaw();
    const getEventPersonal = useGetCalendarEventPersonal();

    useEffect(() => {
        cacheRef.current.isUnmounted = false;
        cacheRef.current.rerender = () => setRerender({});
        return () => {
            cacheRef.current.rerender = undefined;
            cacheRef.current.isUnmounted = true;
        };
    }, []);

    useEffect(() => {
        const toFetch = requestedCalendars.filter(({ ID: CalendarID }) => {
            if (!cacheRef.current.calendars[CalendarID]) {
                cacheRef.current.calendars[CalendarID] = {
                    events: new Map(),
                    recurringEvents: new Map(),
                    decryptedEvents: new Map(),
                    tree: createIntervalTree(),
                    dateRanges: []
                };
            }

            const { dateRanges: calendarDateRanges } = cacheRef.current.calendars[CalendarID];

            // If this date range is contained in the results, we don't need to fill the cache
            return !contains(utcDateRange, calendarDateRanges);
        });

        if (toFetch.length === 0) {
            return;
        }

        setLoading(true);
        const latestRef = ++cacheRef.current.ref;

        (async () => {
            await Promise.all(
                toFetch.map(async ({ ID: CalendarID }) => {
                    const Events = await getPaginatedEvents(api, CalendarID, utcDateRange, tzid);

                    const calendarCache = cacheRef.current.calendars[CalendarID];
                    calendarCache.dateRanges.push([utcDateRange[0], utcDateRange[1]]);

                    Events.forEach((Event) => {
                        setEventInCache(Event, calendarCache, true);
                    });
                })
            );

            // If unmounted, or not the last execution, ignore
            if (cacheRef.current.isUnmounted || latestRef !== cacheRef.current.ref) {
                return;
            }

            setLoading(false);
        })().catch((e) => {
            // If unmounted, or not the last execution, ignore
            if (cacheRef.current.isUnmounted || latestRef !== cacheRef.current.ref) {
                return;
            }

            setLoading(false);
            console.error(e);
        });
    }, [requestedCalendars, utcDateRange]);

    const getDecryptedEvent = (Event: CalendarEvent): Promise<DecryptedTupleResult> => {
        return Promise.all([getEventRaw(Event), getEventPersonal(Event)]);
    };

    const readEvent = useCallback((CalendarID: string, EventID: string): DecryptedEventRecord => {
        if (!cacheRef.current || !cacheRef.current.calendars[CalendarID]) {
            return [undefined, undefined, new Error('Non-existing event')];
        }

        const { decryptedEvents, events } = cacheRef.current.calendars[CalendarID];
        const cachedDecryptedRecord = decryptedEvents.get(EventID);
        if (cachedDecryptedRecord) {
            return cachedDecryptedRecord;
        }

        const cachedEventRecord = events.get(EventID);
        if (!cachedEventRecord) {
            return [undefined, undefined, new Error('Non-existing event')];
        }
        const { Event: cachedEvent } = cachedEventRecord;

        const promise = getDecryptedEvent(cachedEvent)
            .then(
                (result): DecryptedEventRecord => {
                    return [result, undefined, undefined];
                }
            )
            .catch(
                (error: Error): DecryptedEventRecord => {
                    return [undefined, undefined, error];
                }
            )
            .then((record: DecryptedEventRecord) => {
                decryptedEvents.set(EventID, record);
                return record;
            });
        const record: DecryptedEventRecord = [undefined, promise, undefined];
        decryptedEvents.set(EventID, record);
        return record;
    }, []);

    const getCachedEvent = useCallback((calendarID: string, eventID: string) => {
        if (!cacheRef.current || !cacheRef.current.calendars || !cacheRef.current.calendars[calendarID]) {
            return;
        }
        const cachedEvent = cacheRef.current.calendars[calendarID].events.get(eventID);
        return cachedEvent?.Event;
    }, []);

    return useMemo(() => {
        const events: CalendarViewEvent[] = requestedCalendars
            .map((Calendar) => {
                const { ID } = Calendar;
                if (!cacheRef.current || !cacheRef.current.calendars[ID]) {
                    return [];
                }

                const { tree, events, recurringEvents, dateRanges: calendarDateRanges } = cacheRef.current.calendars[
                    ID
                ];

                // If this date range is not contained in the result, we don't return anything because we can't trust the recurring events
                // until we have complete data fetched for this range because of single editions
                if (!contains(utcDateRange, calendarDateRanges)) {
                    return [];
                }

                // Add a day in both ranges to not miss events due to tz since they are stored in UTC time
                const searchStart = +utcDateRange[0] - DAY_IN_MILLISECONDS;
                const searchEnd = +utcDateRange[1] + DAY_IN_MILLISECONDS;

                const results = tree
                    .search(searchStart, searchEnd)
                    .map(([, , id]) => {
                        const cachedRecord = events.get(id);
                        if (!cachedRecord) {
                            return;
                        }
                        const { Event, isAllDay, isAllPartDay, isRecurring, start, end, counter } = cachedRecord;

                        const data = {
                            Event,
                            Calendar,
                            readEvent,
                            counter
                        };

                        return {
                            id,
                            isAllDay,
                            isAllPartDay,
                            isRecurring,
                            start,
                            end,
                            data
                        };
                    })
                    .filter(isTruthy);

                const recurringResults = getRecurringEvents(events, recurringEvents, searchStart, searchEnd)
                    .map(({ id, eventOccurrences, isSingleOccurrence }) => {
                        const cachedRecord = events.get(id);
                        if (!cachedRecord) {
                            return [];
                        }
                        const { Event, isAllDay, isAllPartDay, isRecurring, counter } = cachedRecord;

                        const data = {
                            Event,
                            Calendar,
                            readEvent,
                            counter
                        };

                        return eventOccurrences.map(({ utcStart, utcEnd, localStart, localEnd, occurrenceNumber }) => {
                            const recurrence = {
                                occurrenceNumber,
                                localStart,
                                localEnd,
                                isSingleOccurrence
                            };
                            return {
                                id: `${id}-${occurrenceNumber}`,
                                isAllDay,
                                isAllPartDay,
                                isRecurring,
                                start: utcStart,
                                end: utcEnd,
                                data: {
                                    ...data,
                                    recurrence
                                }
                            };
                        });
                    })
                    .flat(1);

                return results
                    .concat(recurringResults)
                    .map(({ start: utcStart, end: utcEnd, isAllDay, isAllPartDay, isRecurring, data, id }) => {
                        const start = isAllDay
                            ? utcStart
                            : toUTCDate(convertUTCDateTimeToZone(fromUTCDate(utcStart), tzid));
                        const end = isAllDay ? utcEnd : toUTCDate(convertUTCDateTimeToZone(fromUTCDate(utcEnd), tzid));

                        return {
                            id,
                            isAllDay: isAllDay || isAllPartDay,
                            isAllPartDay,
                            isRecurring,
                            start,
                            end,
                            data
                        };
                    });
            })
            .flat();

        return {
            calendarsEvents: events,
            loadingEvents: loading,
            getCachedEvent,
            getDecryptedEvent
        };
    }, [rerender, tzid, loading, requestedCalendars, utcDateRange]);
};

export default useCalendarsEvents;
