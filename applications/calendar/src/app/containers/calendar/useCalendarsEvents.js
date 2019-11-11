import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useApi, useEventManager } from 'react-components';
import { queryEvents } from 'proton-shared/lib/api/calendars';
import { differenceInHours, getUnixTime } from 'date-fns';
import { fromUTCDate, toUTCDate, convertUTCDateTimeToZone } from 'proton-shared/lib/date/timezone';
import { parse } from 'proton-shared/lib/calendar/vcal';
import { unwrap } from 'proton-shared/lib/calendar/helper';
import { propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import useGetCalendarEventRaw from './useGetCalendarEventRaw';
import useGetCalendarEventPersonal from './useGetCalendarEventPersonal';

const { DELETE, CREATE, UPDATE } = EVENT_ACTIONS;

const DAY_IN_MILLISECONDS = 86400000;

const getPaginatedEvents = async (api, calendarID, dateRange, tzid) => {
    let results = [];
    let lastEventID;

    const PageSize = 100;

    const params = {
        Start: getUnixTime(dateRange[0]),
        End: getUnixTime(dateRange[1]),
        Timezone: tzid,
        PageSize,
        Page: 0
    };

    do {
        const { Events } = await api(queryEvents(calendarID, { ...params, Start: lastEventID || params.Start }));
        results = results.concat(Events);
        lastEventID = Events.length === PageSize ? Events[Events.length - 1].ID : undefined;
    } while (lastEventID);

    return results;
};

const contains = (range, otherRanges) => {
    return otherRanges.some((otherRange) => {
        return otherRange && otherRange[1] >= range[1] && otherRange[0] <= range[0];
    });
};

const removeEventFromCache = ({ tree, events, decryptedEvents, EventID }) => {
    const oldEvent = events.get(EventID);
    if (oldEvent) {
        const idx = tree.findIndex(({ EventID: otherEventID }) => otherEventID === EventID);
        tree.splice(idx, 1);
    }
    events.delete(EventID);
    decryptedEvents.delete(EventID);
};

const setEventInCache = ({ tree, events, decryptedEvents, Event, isInitialFetch }) => {
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

        if (oldEvent) {
            const idx = tree.findIndex(({ EventID: otherEventID }) => otherEventID === EventID);
            tree.splice(idx, 1);
        }

        const {
            dtstart,
            dtend,
            dtstart: { parameters: { type = '' } = {} }
        } = component;

        const isAllDay = type === 'date';
        const eventStart = propertyToUTCDate(dtstart);
        const eventEnd = propertyToUTCDate(dtend);

        tree.push({ eventStart: +eventStart, eventEnd: +eventEnd, EventID });
        events.set(EventID, {
            Event,
            isAllDay,
            eventCounter: ((oldEvent && oldEvent.eventCounter) || 0) + 1,
            eventStart,
            eventEnd
        });
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

            let count = 0;

            Calendars.forEach(({ ID: CalendarID, Action }) => {
                if (Action === DELETE) {
                    if (calendars[CalendarID]) {
                        delete cacheRef.current.calendars[CalendarID];
                        count++;
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
                    const { tree, events, decryptedEvents } = cacheRef.current.calendars[calendarID];
                    removeEventFromCache({ tree, events, decryptedEvents, EventID });

                    // TODO: Only increment count if this event happened in the date range we are currently interested in
                    count++;
                }

                if (Action === UPDATE || Action === CREATE) {
                    const { CalendarID } = Event;
                    const { tree, events, decryptedEvents } = cacheRef.current.calendars[CalendarID];

                    setEventInCache({
                        Event,
                        tree,
                        events,
                        decryptedEvents
                    });

                    // TODO: Only increment count if this event happened in the date range we are currently interested in
                    count++;
                }
            });

            if (count > 0) {
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
                    decryptedEvents: new Map(),
                    // Replace with interval tree
                    tree: [],
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

                    const { dateRanges, tree, events, decryptedEvents } = cacheRef.current.calendars[CalendarID];

                    dateRanges.push([utcDateRange[0], utcDateRange[1]]);

                    Events.forEach((Event) => {
                        setEventInCache({
                            Event,
                            tree,
                            events,
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
        })().catch((e) => console.error(e));
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

    return useMemo(() => {
        const events = requestedCalendars
            .map((Calendar) => {
                const { ID } = Calendar;
                if (!cacheRef.current || !cacheRef.current.calendars[ID]) {
                    return [];
                }

                const { tree, events } = cacheRef.current.calendars[ID];

                // Add a day in both ranges to not miss events due to tz since they are stored in UTC time
                const searchStart = +utcDateRange[0] - DAY_IN_MILLISECONDS;
                const searchEnd = +utcDateRange[1] + DAY_IN_MILLISECONDS;

                const results = tree.filter(({ eventStart, eventEnd }) => {
                    return eventStart <= searchEnd && eventEnd >= searchStart;
                });

                return results.map(({ EventID }) => {
                    const { eventStart, eventEnd, eventCounter, Event, isAllDay } = events.get(EventID);
                    const start = isAllDay
                        ? eventStart
                        : toUTCDate(convertUTCDateTimeToZone(fromUTCDate(eventStart), tzid));
                    const end = isAllDay ? eventEnd : toUTCDate(convertUTCDateTimeToZone(fromUTCDate(eventEnd), tzid));
                    const isAllPartDay = differenceInHours(end, start) >= 24;
                    return {
                        data: {
                            Event,
                            Calendar,
                            readEvent,
                            eventCounter
                        },

                        isAllDay: isAllDay || isAllPartDay,
                        isAllPartDay,
                        id: EventID,
                        start,
                        end
                    };
                });
            })
            .flat();

        return [events, loading];
    }, [rerender, tzid, loading, requestedCalendars, utcDateRange]);
};

export default useCalendarsEvents;
