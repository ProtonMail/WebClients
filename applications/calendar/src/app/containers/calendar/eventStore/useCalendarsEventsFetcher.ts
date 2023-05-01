import { MutableRefObject, useEffect, useState } from 'react';

import { useApi } from '@proton/components';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import isTruthy from '@proton/utils/isTruthy';

import { fetchCalendarEvents } from './cache/fetchCalendarEvents';
import getCalendarEventsCache from './cache/getCalendarEventsCache';
import { CalendarsEventsCache } from './interface';

const useCalendarsEventsFetcher = (
    requestedCalendars: Calendar[],
    utcDateRange: [Date, Date],
    tzid: string,
    cacheRef: MutableRefObject<CalendarsEventsCache>,
    initializeCacheOnlyCalendarsIDs: string[],
    onCacheInitialized: () => void
) => {
    const [loading, setLoading] = useState(false);
    const api = useApi();

    useEffect(() => {
        const calendarFetchPromises = requestedCalendars
            .map(({ ID: CalendarID }) => {
                let calendarEventsCache = cacheRef.current.calendars[CalendarID];
                if (!calendarEventsCache) {
                    calendarEventsCache = getCalendarEventsCache();
                    cacheRef.current.calendars[CalendarID] = calendarEventsCache;
                }
                return fetchCalendarEvents(
                    utcDateRange,
                    calendarEventsCache,
                    api,
                    CalendarID,
                    tzid,
                    initializeCacheOnlyCalendarsIDs.includes(CalendarID)
                );
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
                // even if some promise is rejected, consider cache initialized
                onCacheInitialized();
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
