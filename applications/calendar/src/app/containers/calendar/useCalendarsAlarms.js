import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { useApi, useEventManager, useLoading } from 'react-components';
import { getUnixTime } from 'date-fns';

import { queryCalendarAlarms } from 'proton-shared/lib/api/calendars';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { orderBy } from 'proton-shared/lib/helpers/array';
import { insertAlarm, deleteAlarm } from '../../helpers/alarms';
import { DAY } from '../../constants';

const { DELETE, CREATE, UPDATE } = EVENT_ACTIONS;
const MAX_PAGE_SIZE = 100;

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
    return await queryAllCalendarAlarms({
        calendarID,
        Start: newAlarms[newAlarmsLength - 1].Occurrence,
        End,
        previousAlarms: allAlarms
    });
};

/**
 * @param {Array<Object>} requestedCalendars
 * @param {Number} lookAhead
 */
const useCalendarsAlarms = (requestedCalendars, lookAhead = 14 * DAY) => {
    const [loading, withLoading] = useLoading(true);
    const [calendarAlarms, setCalendarAlarms] = useState({});

    const { subscribe } = useEventManager();
    const api = useApi();
    const cacheRef = useRef();

    const requestedCalendarsIDs = useMemo(() => {
        return requestedCalendars.map(({ ID }) => ID);
    }, [requestedCalendars]);

    const fetchAlarms = useCallback(async ({ api, IDs, end }) => {
        const Start = getUnixTime(Date.now());
        const End = end || Start + lookAhead;
        await Promise.all(
            IDs.map(async (ID) => {
                if (!cacheRef.current.checkedCalendars[ID]) {
                    cacheRef.current.checkedCalendars[ID] = true;
                    // eslint-disable-next-line require-atomic-updates
                    const allCalendarAlarms = await queryAllCalendarAlarms({ api, calendarID: ID, Start, End });
                    setCalendarAlarms((alarms) => ({ ...alarms, [ID]: allCalendarAlarms }));
                }
            })
        );
    }, []);

    // initial fetch
    useEffect(() => {
        const abortController = new AbortController();
        const apiWithAbort = (config) => api({ ...config, signal: abortController.signal });

        // clear possible interval timeout in cache
        if (cacheRef.current) {
            clearInterval(cacheRef.current.intervalID);
        }
        cacheRef.current = {
            checkedCalendars: Object.create(null),
            end: getUnixTime(Date.now()) + lookAhead,
            abortController
        };

        // fetch alarms
        withLoading(fetchAlarms({ api: apiWithAbort, IDs: requestedCalendarsIDs }));

        // set interval for fetching alarms again after (lookahead / 2) has passed
        cacheRef.current.intervalID = setInterval(() => {
            // clear alarms in cache
            cacheRef.current.checkedCalendars = Object.create(null);
            withLoading(fetchAlarms({ api: apiWithAbort, IDs: requestedCalendarsIDs }));
        }, (1000 * lookAhead) / 2);

        return () => {
            clearInterval(cacheRef.current.intervalID);
            abortController.abort();
        };
    }, [lookAhead]);

    // potential new fetch on requestedCalendars change
    useEffect(() => {
        if (!cacheRef.current) {
            return;
        }
        const apiWithAbort = (config) => api({ ...config, signal: cacheRef.current.abortController.signal });
        fetchAlarms({ api: apiWithAbort, IDs: requestedCalendarsIDs, end: cacheRef.current.end });
    }, [requestedCalendarsIDs]);

    // listen to changes in calendar alarms in the database. Update alarms if needed
    useEffect(() => {
        return subscribe(({ CalendarAlarms = [] }) => {
            if (!cacheRef.current) {
                return;
            }
            const filteredAlarms = CalendarAlarms.filter(
                ({ Action, Alarm: { Occurrence } = {} }) =>
                    Action === DELETE || (Occurrence !== null && Occurrence < cacheRef.current.end)
            );
            if (!filteredAlarms.length) {
                return;
            }
            for (const { ID: alarmID, Action, Alarm = {} } of filteredAlarms) {
                if (Action === DELETE) {
                    setCalendarAlarms((alarms) => deleteAlarm(alarmID, alarms));
                }
                if (Action === CREATE) {
                    // place the new alarm in the list of alarms in the proper order
                    setCalendarAlarms((alarms) => insertAlarm(Alarm, alarms, Alarm.CalendarID));
                }
                if (Action === UPDATE) {
                    // this case only happens when the user changes timezone
                    setCalendarAlarms((alarms) => {
                        // the easiest way to update is to first erase the alarm from the list
                        const filteredAlarms = alarms.filter(({ ID }) => ID !== alarmID);
                        return insertAlarm(Alarm, filteredAlarms, Alarm.CalendarID);
                    });
                }
            }
        });
    }, []);

    return useMemo(() => {
        const activeAlarms = requestedCalendarsIDs.map((calendarID) => calendarAlarms[calendarID]).flat();
        const orderedActiveAlarms = orderBy(activeAlarms, 'Occurrence');
        return [orderedActiveAlarms, loading];
    }, [calendarAlarms, loading, requestedCalendarsIDs]);
};

export default useCalendarsAlarms;
