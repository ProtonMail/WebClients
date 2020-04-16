import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useApi, useEventManager } from 'react-components';
import { fromUTCDate, toUTCDate, convertUTCDateTimeToZone } from 'proton-shared/lib/date/timezone';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import createIntervalTree from 'interval-tree';
import useGetCalendarEventRaw from './useGetCalendarEventRaw';
import useGetCalendarEventPersonal from './useGetCalendarEventPersonal';
import { removeEventFromCache, setEventInCache } from './cache/cache';
import getPaginatedEvents from './getPaginatedEvents';
import { getRecurringEvents } from './cache/getRecurringEvents';

const { DELETE, CREATE, UPDATE } = EVENT_ACTIONS;

const DAY_IN_MILLISECONDS = 86400000;

const contains = (range, otherRanges) => {
    return otherRanges.some((otherRange) => {
        return otherRange && otherRange[1] >= range[1] && otherRange[0] <= range[0];
    });
};

/**
 * @param {Array} requestedCalendars
 * @param {Array} utcDateRange - Date range in UTC time
 * @param {String} tzid - Timezone to view the events in
 */
const useCalendarsEvents = (requestedCalendars, utcDateRange, tzid) => {
    const [loading, setLoading] = useState(false);
    const cacheRef = useRef();
    const [rerender, setRerender] = useState(0);
    const { subscribe } = useEventManager();
    const api = useApi();

    const getEventRaw = useGetCalendarEventRaw();
    const getEventPersonal = useGetCalendarEventPersonal();

    useEffect(() => {
        return subscribe(({ CalendarEvents = [], Calendars = [] }) => {
            if (!cacheRef.current) {
                return;
            }

            const calendars = cacheRef.current.calendars;

            let actions = 0;

            Calendars.forEach(({ ID: CalendarID, Action }) => {
                if (Action === DELETE) {
                    if (calendars[CalendarID]) {
                        delete cacheRef.current.calendars[CalendarID];
                        actions++;
                    }
                }
            });

            CalendarEvents.forEach(({ ID: EventID, Action, Event }) => {
                if (Action === DELETE) {
                    // The API does not send the calendar id to which this event belongs, so find it
                    const calendarID = Object.keys(calendars).find((calendarID) => {
                        return cacheRef.current.calendars[calendarID].events.has(EventID);
                    });
                    if (!calendarID) {
                        return;
                    }
                    removeEventFromCache(EventID, cacheRef.current.calendars[calendarID]);
                    // TODO: Only increment count if this event happened in the date range we are currently interested in
                    actions++;
                }

                if (Action === UPDATE || Action === CREATE) {
                    const { CalendarID } = Event;

                    const calendarCache = cacheRef.current.calendars[CalendarID];
                    if (!calendarCache) {
                        return;
                    }
                    setEventInCache(Event, calendarCache);
                    // TODO: Only increment count if this event happened in the date range we are currently interested in
                    actions++;
                }
            });

            if (actions > 0) {
                setRerender((old) => ++old);
            }
        });
    }, []);

    useEffect(() => {
        return () => {
            if (!cacheRef.current) {
                return;
            }
            cacheRef.current.isUnmounted = true;
        };
    }, []);

    useEffect(() => {
        if (!cacheRef.current) {
            cacheRef.current = {
                ref: 0,
                isUnmounted: false,
                calendars: {}
            };
        }

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

                    const { dateRanges, tree, events, recurringEvents, decryptedEvents } = cacheRef.current.calendars[
                        CalendarID
                    ];

                    dateRanges.push([utcDateRange[0], utcDateRange[1]]);

                    Events.forEach((Event) => {
                        setEventInCache(Event, {
                            tree,
                            events,
                            recurringEvents,
                            decryptedEvents,
                            isInitialFetch: true
                        });
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

    const getDecryptedEvent = (Event) => {
        return Promise.all([getEventRaw(Event), getEventPersonal(Event)]);
    };

    const readEvent = useCallback((CalendarID, EventID) => {
        if (!cacheRef.current || !cacheRef.current.calendars[CalendarID]) {
            return [undefined, undefined, new Error('Non-existing event')];
        }

        const { decryptedEvents, events } = cacheRef.current.calendars[CalendarID];
        if (decryptedEvents.has(EventID)) {
            return decryptedEvents.get(EventID);
        }

        if (!events.has(EventID)) {
            return [undefined, undefined, new Error('Non-existing event')];
        }
        const { Event: cachedEvent } = events.get(EventID);

        const promise = getDecryptedEvent(cachedEvent)
            .then((result) => {
                return [result, undefined, undefined];
            })
            .catch((error) => {
                return [undefined, undefined, error];
            })
            .then((record) => {
                decryptedEvents.set(EventID, record);
                return record;
            });
        const record = [undefined, promise, undefined];
        decryptedEvents.set(EventID, record);
        return record;
    }, []);

    const getCachedEvent = useCallback((calendarID, eventID) => {
        if (!cacheRef.current || !cacheRef.current.calendars || !cacheRef.current.calendars[calendarID]) {
            return;
        }
        const cachedEvent = cacheRef.current.calendars[calendarID].events.get(eventID);
        if (cachedEvent && cachedEvent.Event) {
            return cachedEvent.Event;
        }
    }, []);

    return useMemo(() => {
        const events = requestedCalendars
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

                const results = tree.search(searchStart, searchEnd).map(([, , id]) => {
                    const { Event, isAllDay, isAllPartDay, isRecurring, start, end, counter } = events.get(id);

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
                });

                const recurringResults = getRecurringEvents(events, recurringEvents, searchStart, searchEnd)
                    .map(({ id, eventOccurrences, isSingleOccurrence }) => {
                        const { Event, isAllDay, isAllPartDay, isRecurring, counter } = events.get(id);

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
                    .flat();

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

        return [events, loading, getCachedEvent, getDecryptedEvent];
    }, [rerender, tzid, loading, requestedCalendars, utcDateRange]);
};

export default useCalendarsEvents;
