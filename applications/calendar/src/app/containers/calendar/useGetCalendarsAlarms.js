import { useEffect, useState, useMemo, useRef } from 'react';
import { useApi, useEventManager, useLoading } from 'react-components';
import { getUnixTime } from 'date-fns';

import { queryCalendarAlarms } from 'proton-shared/lib/api/calendars';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { orderBy } from 'proton-shared/lib/helpers/array';
import { insertAlarm } from '../../helpers/alarms';
import { DAY } from '../../constants';

const { DELETE, CREATE, UPDATE } = EVENT_ACTIONS;
const MAX_PAGE_SIZE = 100;

/**
 * @param {Array<Object>} requestedCalendars
 * @param {Number} lookAhead
 */
const useGetCalendarsAlarms = (requestedCalendars, lookAhead = 14 * DAY) => {
    const [loading, withLoading] = useLoading();
    const [alarms, setAlarms] = useState([]);

    const { subscribe } = useEventManager();
    const api = useApi();
    const cacheRef = useRef();

    const requestedCalendarsIDs = useMemo(() => {
        return requestedCalendars.map(({ ID }) => ID);
    });

    useEffect(() => {
        if (!cacheRef.current) {
            cacheRef.current = Object.create(null);
        }
        // take into account pagination in queryCalendarAlarms route
        const queryAllCalendarAlarms = async ({ calendarID, Start, End, previousAlarms = [] }) => {
            const newAlarms = (await api(queryCalendarAlarms(calendarID, { Start, End, PageSize: MAX_PAGE_SIZE })))
                .Alarms;
            const newAlarmsLength = newAlarms.length;
            const allAlarms = [...previousAlarms, ...newAlarms];
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
        // fetch all alarms from all active calendars
        const fetchAlarms = async () => {
            const now = getUnixTime(Date.now());
            const fetchedAlarms = await Promise.all(
                requestedCalendars.map(({ ID }) =>
                    queryAllCalendarAlarms({ calendarID: ID, Start: now, End: now + lookAhead })
                )
            );
            // we rebuild the list of alarms completely as there is no need to keep previous alarms
            setAlarms(orderBy(fetchedAlarms.flat(), 'Occurrence'));
        };

        clearInterval(cacheRef.current.intervalID);
        withLoading(fetchAlarms());
        cacheRef.current.intervalID = setInterval(() => {
            withLoading(fetchAlarms());
        }, lookAhead / 2);

        return () => {
            clearInterval(cacheRef.current.intervalID);
        };
    }, [requestedCalendars, lookAhead]);

    // listen to changes in calendar alarms in the database. Update alarms if needed
    useEffect(() => {
        return subscribe(({ CalendarAlarms = [] }) => {
            const futureRequestedAlarms = CalendarAlarms.filter(
                ({ Action, Alarm: { Occurrence, CalendarID } = {} }) =>
                    Action === DELETE ||
                    (requestedCalendarsIDs.includes(CalendarID) &&
                        Occurrence !== null &&
                        Occurrence - getUnixTime(Date.now()) < lookAhead)
            );
            if (!futureRequestedAlarms.length) {
                return;
            }
            for (const { ID: alarmID, Action, Alarm = {} } of futureRequestedAlarms) {
                if (Action === DELETE) {
                    setAlarms((alarms) => alarms.filter(({ ID }) => ID !== alarmID));
                }
                if (Action === CREATE) {
                    // place the new alarm in the list of alarms in the proper order
                    setAlarms((alarms) => insertAlarm(Alarm, alarms));
                }
                if (Action === UPDATE) {
                    // this case only happens when the user changes timezone
                    setAlarms((alarms) => {
                        // the easiest way to update is to first erase the alarm from the list
                        const filteredAlarms = alarms.filter(({ ID }) => ID !== alarmID);
                        return insertAlarm(Alarm, filteredAlarms);
                    });
                }
            }
        });
    }, []);

    return [alarms, setAlarms, loading];
};

export default useGetCalendarsAlarms;
