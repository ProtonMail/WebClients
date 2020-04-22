import { useEffect, useMemo, useRef, useState } from 'react';
import { useApi, useEventManager } from 'react-components';

import { addMilliseconds } from 'proton-shared/lib/date-fns-utc';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { Calendar as tsCalendar } from 'proton-shared/lib/interfaces/calendar';

import { DAY } from '../../constants';
import { CalendarAlarmEventManager, CalendarEventManager } from '../../interfaces/EventManager';
import getCalendarsAlarmsCached from './getCalendarsAlarmsCached';
import { Cache } from './CacheInterface';

const { DELETE, CREATE, UPDATE } = EVENT_ACTIONS;

const PADDING = 60 * 1000 * 2;

const dummyCache = {
    cache: {},
    start: new Date(2000, 1, 1),
    end: new Date(2000, 1, 1)
};

const useCalendarsAlarms = (calendars: tsCalendar[], lookAhead = 2 * DAY * 1000) => {
    const { subscribe } = useEventManager();
    const api = useApi();
    const cacheRef = useRef<Cache>(dummyCache);
    const [forceRefresh, setForceRefresh] = useState<any>();

    const calendarIDs = useMemo(() => calendars.map(({ ID }) => ID), [calendars]);

    useEffect(() => {
        let timeoutHandle = 0;
        let unmounted = false;

        const update = async () => {
            const now = new Date();

            // Cache is invalid
            if (!cacheRef.current || +cacheRef.current.end - PADDING <= +now) {
                cacheRef.current = {
                    cache: {},
                    start: now,
                    end: addMilliseconds(now, lookAhead)
                };
            }

            const promise = (cacheRef.current.promise = getCalendarsAlarmsCached(
                api,
                cacheRef.current.cache,
                calendarIDs,
                [cacheRef.current.start, cacheRef.current.end]
            ));

            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
            }

            await promise;

            // If it's not the latest, ignore
            if (unmounted || promise !== cacheRef.current.promise) {
                return;
            }

            const delay = Math.max(0, +cacheRef.current.end - PADDING - Date.now());

            timeoutHandle = window.setTimeout(update, delay);

            setForceRefresh({});
        };

        update();

        return () => {
            unmounted = true;
            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
            }
        };
    }, [calendarIDs]);

    useEffect(() => {
        return subscribe(
            ({
                CalendarAlarms = [],
                Calendars = []
            }: {
                CalendarAlarms?: CalendarAlarmEventManager[];
                Calendars?: CalendarEventManager[];
            }) => {
                if (!cacheRef.current) {
                    return;
                }

                let actions = 0;

                const { cache, end } = cacheRef.current;
                const now = new Date();

                Calendars.forEach(({ ID: CalendarID, Action }) => {
                    if (Action === DELETE) {
                        if (cache[CalendarID]) {
                            delete cache[CalendarID];
                            actions++;
                        }
                    }
                });

                const calendarAlarmChangesToTreat = CalendarAlarms.filter((CalendarAlarmChange) => {
                    // If it's delete we'll fallback to search later
                    if (CalendarAlarmChange.Action === DELETE) {
                        return true;
                    }

                    const { Occurrence, CalendarID } = CalendarAlarmChange.Alarm;

                    const hasCalendarInCache = !!cache[CalendarID];
                    const occurrenceInMs = Occurrence > 0 ? Occurrence * 1000 : -1;
                    const isAlarmInRange = Occurrence !== -1 && occurrenceInMs >= +now && occurrenceInMs <= +end;

                    return hasCalendarInCache && isAlarmInRange;
                });

                for (const CalendarAlarmChange of calendarAlarmChangesToTreat) {
                    if (CalendarAlarmChange.Action === DELETE) {
                        const { ID: AlarmID } = CalendarAlarmChange;
                        let index = -1;

                        const calendarID = Object.keys(cache).find((calendarID) => {
                            const result = cache[calendarID]?.result;
                            if (!result) {
                                return false;
                            }
                            index = result.findIndex(({ ID: otherID }) => otherID === AlarmID);
                            return index !== -1;
                        });

                        if (calendarID && index >= 0) {
                            const result = cache[calendarID]?.result;
                            if (result) {
                                result.splice(index, 1);
                                actions++;
                            }
                        }
                    }

                    if (CalendarAlarmChange.Action === CREATE) {
                        const {
                            Alarm,
                            Alarm: { CalendarID }
                        } = CalendarAlarmChange;

                        const result = cache[CalendarID]?.result;
                        if (result) {
                            result.push(Alarm);
                            actions++;
                        }
                    }

                    // This case only happens when the user changes timezone
                    if (CalendarAlarmChange.Action === UPDATE) {
                        const {
                            Alarm,
                            Alarm: { ID: AlarmID, CalendarID }
                        } = CalendarAlarmChange;

                        const result = cache[CalendarID]?.result;
                        if (result) {
                            const index = result.findIndex(({ ID: otherID }) => otherID === AlarmID);
                            if (index >= 0) {
                                result.splice(index, 1, Alarm);
                                actions++;
                            }
                        }
                    }
                }

                if (actions) {
                    setForceRefresh({});
                }
            }
        );
    }, []);

    return useMemo(() => {
        if (!cacheRef.current) {
            return [];
        }
        const { cache } = cacheRef.current;
        return calendarIDs
            .map((calendarID) => {
                return cache[calendarID]?.result ?? [];
            })
            .flat()
            .sort((a, b) => {
                return a.Occurrence - b.Occurrence;
            });
    }, [forceRefresh, calendarIDs]);
};

export default useCalendarsAlarms;
