import { MutableRefObject, useEffect, useState } from 'react';
import { useApi } from 'react-components';
import { Calendar } from 'proton-shared/lib/interfaces/calendar';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { CalendarsEventsCache } from './interface';
import getCalendarEventCache from './cache/getCalendarEventCache';
import { fetchCalendarEvents } from './cache/fetchCalendarEvents';

const useCalendarsEventsFetcher = (
    requestedCalendars: Calendar[],
    utcDateRange: [Date, Date],
    tzid: string,
    cacheRef: MutableRefObject<CalendarsEventsCache>
) => {
    const [loading, setLoading] = useState(false);
    const api = useApi();

    useEffect(() => {
        const calendarFetchPromises = requestedCalendars
            .map(({ ID: CalendarID }) => {
                if (!cacheRef.current.calendars[CalendarID]) {
                    cacheRef.current.calendars[CalendarID] = getCalendarEventCache();
                }
                const calendarEventCache = cacheRef.current.calendars[CalendarID];
                return fetchCalendarEvents(utcDateRange, calendarEventCache, api, CalendarID, tzid);
            })
            .filter(isTruthy);

        if (calendarFetchPromises.length === 0) {
            return setLoading(false);
        }

        let isActive = true;
        setLoading(true);
        const done = () => {
            if (isActive) {
                setLoading(false);
            }
        };

        Promise.all(calendarFetchPromises).then(done, done);

        return () => {
            isActive = false;
        };
    }, [requestedCalendars, utcDateRange]);

    return loading;
};

export default useCalendarsEventsFetcher;
