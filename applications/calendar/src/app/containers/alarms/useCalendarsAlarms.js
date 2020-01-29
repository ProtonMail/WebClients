import { useEffect, useMemo, useRef, useState } from 'react';
import { useApi, useEventManager } from 'react-components';
import { getUnixTime } from 'date-fns';

import { queryCalendarAlarms } from 'proton-shared/lib/api/calendars';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { DAY } from '../../constants';
import { addMilliseconds } from 'proton-shared/lib/date-fns-utc';

const { DELETE, CREATE, UPDATE } = EVENT_ACTIONS;
const MAX_PAGE_SIZE = 100;

const PADDING = 60 * 1000 * 2;

/**
 * Query calendar alarms, taking into account pagination in queryCalendarAlarms route
 * @param {Function} api
 * @param {String} calendarID
 * @param {Number} Start
 * @param {Number} End
 * @param {Array} previousAlarms
 * @returns {Promise<Array>}
 */
const queryAllCalendarAlarms = async ({ api, calendarID, Start, End, previousAlarms = [] }) => {
    const { Alarms: newAlarms } = await api(queryCalendarAlarms(calendarID, { Start, End, PageSize: MAX_PAGE_SIZE }));
    const newAlarmsLength = newAlarms.length;
    const allAlarms = previousAlarms.concat(newAlarms);
    if (newAlarmsLength !== MAX_PAGE_SIZE) {
        return allAlarms;
    }
    return queryAllCalendarAlarms({
        calendarID,
        Start: newAlarms[newAlarmsLength - 1].Occurrence,
        End,
        previousAlarms: allAlarms
    });
};

const fetchAlarms = async ({ api, cache, calendarIDs, start, end }) => {
    return Promise.all(
        calendarIDs.map((ID) => {
            if (!cache[ID]) {
                const promise = queryAllCalendarAlarms({ api, calendarID: ID, Start: start, End: end })
                    .then((result) => {
                        cache[ID] = {
                            result
                        };
                    })
                    .catch(() => {
                        cache[ID] = undefined;
                    });
                cache[ID] = {
                    promise
                };
            }
            return cache[ID].promise || cache[ID].result;
        })
    );
};

/**
 * @param {Array<Object>} calendars
 * @param {Number} lookAhead
 */
const useCalendarsAlarms = (calendars, lookAhead = 2 * DAY * 1000) => {
    const { subscribe } = useEventManager();
    const api = useApi();
    const cacheRef = useRef();
    const [forceRefresh, setForceRefresh] = useState();

    const calendarIDs = useMemo(() => calendars.map(({ ID }) => ID), [calendars]);

    // initial fetch
    useEffect(() => {
        let timeoutHandle;
        let unmounted = false;

        const update = async () => {
            const now = new Date();

            // Cache is invalid
            if (!cacheRef.current || cacheRef.current.end - PADDING <= now) {
                cacheRef.current = {
                    cache: {},
                    start: now,
                    end: addMilliseconds(now, lookAhead)
                };
            }

            const promise = (cacheRef.current.promise = fetchAlarms({
                api,
                calendarIDs: calendarIDs,
                cache: cacheRef.current.cache,
                start: getUnixTime(cacheRef.current.start),
                end: getUnixTime(cacheRef.current.end)
            }));

            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
            }

            await promise;

            // If it's not the latest, ignore
            if (unmounted || promise !== cacheRef.current.promise) {
                return;
            }

            const delay = Math.max(0, cacheRef.current.end - PADDING - Date.now());

            // eslint-disable-next-line require-atomic-updates
            timeoutHandle = setTimeout(update, delay);

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

    // listen to changes in calendar alarms in the database. Update alarms if needed
    useEffect(() => {
        return subscribe(({ CalendarAlarms = [], Calendars = [] }) => {
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

            const filteredAlarms = CalendarAlarms.filter(({ Action, Alarm: { CalendarID, Occurrence } = {} }) => {
                // If it's delete we'll fallback to search later
                if (Action === DELETE) {
                    return true;
                }

                const hasCalendarInCache = !!cache[CalendarID];
                const occurrenceInMs = Occurrence > 0 ? Occurrence * 1000 : -1;
                const isAlarmInRange = Occurrence !== -1 && occurrenceInMs >= now && occurrenceInMs <= end;

                return hasCalendarInCache && isAlarmInRange;
            });

            for (const { ID: alarmID, Action, Alarm, Alarm: { CalendarID } = {} } of filteredAlarms) {
                if (Action === DELETE) {
                    let index;
                    const calendarID = Object.keys(cache).find((calendarID) => {
                        index = cache[calendarID].result.findIndex(({ ID: otherID }) => otherID === alarmID);
                        return index !== -1;
                    });
                    if (calendarID && index >= 0) {
                        cache[calendarID].result.splice(index, 1);
                        actions++;
                    }
                }

                if (Action === CREATE) {
                    cache[CalendarID].result.push(Alarm);
                    actions++;
                }

                if (Action === UPDATE) {
                    // This case only happens when the user changes timezone
                    const index = cache[CalendarID].result.findIndex(({ ID: otherID }) => otherID === alarmID);
                    if (index >= 0) {
                        cache[CalendarID].result.splice(index, 1, Alarm);
                        actions++;
                    }
                }
            }

            if (actions) {
                setForceRefresh({});
            }
        });
    }, []);

    return useMemo(() => {
        if (!cacheRef.current) {
            return [];
        }
        const { cache } = cacheRef.current;
        return calendarIDs
            .map((calendarID) => {
                return (cache[calendarID] && cache[calendarID].result) || [];
            })
            .flat()
            .sort((a, b) => {
                return a.Occurrence - b.Occurrence;
            });
    }, [forceRefresh, calendarIDs]);
};

export default useCalendarsAlarms;
