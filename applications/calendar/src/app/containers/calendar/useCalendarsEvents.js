import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useApi, useEventManager } from 'react-components';
import { queryEvents } from 'proton-shared/lib/api/calendars';
import { differenceInHours, getUnixTime } from 'date-fns';
import { fromUTCDate, toUTCDate, convertUTCDateTimeToZone } from 'proton-shared/lib/date/timezone';
import { isIcalRecurring, getOccurrencesBetween } from 'proton-shared/lib/calendar/recurring';
import { parse } from 'proton-shared/lib/calendar/vcal';
import { unwrap } from 'proton-shared/lib/calendar/helper';
import { isIcalAllDay, propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import createIntervalTree from 'interval-tree';
import { addDays, max } from 'proton-shared/lib/date-fns-utc';
import useGetCalendarEventRaw from './useGetCalendarEventRaw';
import useGetCalendarEventPersonal from './useGetCalendarEventPersonal';

const { DELETE, CREATE, UPDATE } = EVENT_ACTIONS;

const DAY_IN_MILLISECONDS = 86400000;

const parseNextPaginationStart = ({ SharedEvents = [] }) => {
    try {
        const { Data = '' } = SharedEvents.find(({ Type }) => Type === 2);
        const component = parse(unwrap(Data));
        if (component.component !== 'vevent') {
            return undefined;
        }
        const { dtstart } = component;
        return getUnixTime(propertyToUTCDate(dtstart));
    } catch (e) {
        return undefined;
    }
};

const getPaginatedEvents = async (api, calendarID, dateRange, tzid) => {
    let results = [];

    const PageSize = 100;

    const params = {
        Start: getUnixTime(dateRange[0]),
        End: getUnixTime(dateRange[1]),
        Timezone: tzid,
        PageSize,
        Page: 0
    };

    let lastStart = params.Start;

    while (lastStart) {
        const { Events } = await api(queryEvents(calendarID, { ...params, Start: lastStart }));
        const lastEvent = Events.length > 0 ? Events[Events.length - 1] : undefined;
        results = results.concat(Events);
        lastStart = Events.length === PageSize && lastEvent ? parseNextPaginationStart(lastEvent) : undefined;
    }

    return results;
};

const getRecurringEvents = (events, recurringEvents, searchStart, searchEnd) => {
    const result = [];
    for (const id of recurringEvents.keys()) {
        const { component } = events.get(id);
        const recurringEventCache = recurringEvents.get(id);

        const utcIntervals = getOccurrencesBetween(component, searchStart, searchEnd, recurringEventCache);

        if (!utcIntervals.length) {
            continue;
        }

        result.push({ id, events: utcIntervals });
    }
    return result;
};

const contains = (range, otherRanges) => {
    return otherRanges.some((otherRange) => {
        return otherRange && otherRange[1] >= range[1] && otherRange[0] <= range[0];
    });
};

const removeEventFromCache = (EventID, { tree, events, decryptedEvents, recurringEvents }) => {
    const oldEvent = events.get(EventID);
    if (oldEvent) {
        tree.remove(+oldEvent.start, +oldEvent.end, EventID);
    }
    recurringEvents.delete(EventID);
    events.delete(EventID);
    decryptedEvents.delete(EventID);
};

const setEventInCache = (Event, { tree, events, recurringEvents, decryptedEvents, isInitialFetch }) => {
    try {
        const { ID: EventID, SharedEvents } = Event;

        const oldEvent = events.get(EventID);
        /**
         * Since the event could already have been fetched, we don't need to re-set this event.
         * We are only interested in updating the event if it's an update from the event manager.
         */
        if (oldEvent && isInitialFetch) {
            return;
        }

        const { Data = '' } = SharedEvents.find(({ Type }) => Type === 2);
        const component = parse(unwrap(Data));

        if (component.component !== 'vevent') {
            return;
        }

        const { dtstart, dtend } = component;

        const isAllDay = isIcalAllDay(component);
        const isRecurring = isIcalRecurring(component);

        const start = propertyToUTCDate(dtstart);
        const rawEnd = propertyToUTCDate(dtend);
        const modifiedEnd = isAllDay
            ? addDays(rawEnd, -1) // All day event range is non-inclusive
            : rawEnd;
        const end = max(start, modifiedEnd);

        const isAllPartDay = !isAllDay && differenceInHours(end, start) >= 24;

        if (isRecurring) {
            if (oldEvent && !oldEvent.isRecurring) {
                tree.remove(+oldEvent.start, +oldEvent.end, EventID);
            }

            recurringEvents.set(EventID, {});
        } else {
            const isOldRecurring = oldEvent && oldEvent.isRecurring;
            if (isOldRecurring) {
                recurringEvents.delete(EventID);
            }

            if (!oldEvent || isOldRecurring) {
                tree.insert(+start, +end, EventID);
            } else if (+start !== +oldEvent.start || +end !== +oldEvent.end) {
                // Interval changed
                tree.remove(+oldEvent.start, +oldEvent.end, EventID);
                tree.insert(+start, +end, EventID);
            }
        }

        const record = {
            Event,
            component,

            isRecurring,
            isAllDay,
            isAllPartDay,

            start,
            end,

            counter: ((oldEvent && oldEvent.counter) || 0) + 1
        };

        events.set(EventID, record);
        decryptedEvents.delete(EventID);
    } catch (e) {
        console.error(e);
    }
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

    const readEvent = useCallback((CalendarID, EventID) => {
        if (!cacheRef.current || !cacheRef.current.calendars[CalendarID]) {
            return [new Error('Non-existing event')];
        }

        const { decryptedEvents, events } = cacheRef.current.calendars[CalendarID];
        const { Event } = events.get(EventID);

        if (!events.has(EventID)) {
            return [new Error('Non-existing event')];
        }

        if (decryptedEvents.has(EventID)) {
            return decryptedEvents.get(EventID);
        }

        const promise = Promise.all([getEventRaw(Event), getEventPersonal(Event)])
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

                const { tree, events, recurringEvents } = cacheRef.current.calendars[ID];

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
                    .map(({ id, events: expandedEvents }) => {
                        const { Event, isAllDay, isAllPartDay, isRecurring, counter } = events.get(id);

                        const data = {
                            Event,
                            Calendar,
                            readEvent,
                            counter
                        };

                        return expandedEvents.map(([start, end], i) => {
                            return {
                                id: `${id}-${i}`,
                                isAllDay,
                                isAllPartDay,
                                isRecurring,
                                start,
                                end,
                                data
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

        return [events, loading, getCachedEvent];
    }, [rerender, tzid, loading, requestedCalendars, utcDateRange]);
};

export default useCalendarsEvents;
