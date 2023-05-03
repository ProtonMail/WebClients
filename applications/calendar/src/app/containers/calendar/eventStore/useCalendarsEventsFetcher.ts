import { useEffect, useState } from 'react';

import { useApi } from '@proton/components';
import { Calendar } from '@proton/shared/lib/interfaces/calendar';
import isTruthy from '@proton/utils/isTruthy';

import { OpenedMailEvent } from '../../../hooks/useGetOpenedMailEvents';
import { fetchCalendarEvents } from './cache/fetchCalendarEvents';
import getCalendarEventsCache from './cache/getCalendarEventsCache';
import { CalendarsEventsCache } from './interface';

const useCalendarsEventsFetcher = ({
    calendars,
    dateRange,
    tzid,
    calendarsEventsCache,
    initializeCacheOnlyCalendarsIDs,
    getOpenedMailEvents,
    onCacheInitialized,
    metadataOnly,
}: {
    calendars: Calendar[];
    dateRange: [Date, Date];
    tzid: string;
    calendarsEventsCache: CalendarsEventsCache;
    getOpenedMailEvents: () => OpenedMailEvent[];
    initializeCacheOnlyCalendarsIDs: string[];
    onCacheInitialized: () => void;
    metadataOnly?: boolean;
}) => {
    const [loading, setLoading] = useState(false);
    const api = useApi();

    useEffect(() => {
        const calendarFetchPromises = calendars
            .map(({ ID: calendarID }) => {
                let calendarEventsCache = calendarsEventsCache.calendars[calendarID];
                if (!calendarEventsCache) {
                    calendarEventsCache = getCalendarEventsCache();
                    calendarsEventsCache.calendars[calendarID] = calendarEventsCache;
                }
                return fetchCalendarEvents({
                    calendarID,
                    dateRange,
                    tzid,
                    calendarEventsCache,
                    noFetch: initializeCacheOnlyCalendarsIDs.includes(calendarID),
                    metadataOnly,
                    api,
                    getOpenedMailEvents,
                });
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
    }, [calendars, dateRange]);

    return loading;
};

export default useCalendarsEventsFetcher;
