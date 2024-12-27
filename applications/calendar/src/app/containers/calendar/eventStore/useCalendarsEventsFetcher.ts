import type { MutableRefObject } from 'react';
import { useEffect, useState } from 'react';

import { useApi } from '@proton/components';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import useFlag from '@proton/unleash/useFlag';
import isTruthy from '@proton/utils/isTruthy';

import type { OpenedMailEvent } from '../../../hooks/useGetOpenedMailEvents';
import { fetchCalendarEvents } from './cache/fetchCalendarEvents';
import getCalendarEventsCache from './cache/getCalendarEventsCache';
import { getCalendarEvents } from './getCalendarEvents';
import type { CalendarsEventsCache } from './interface';
import useCalendarsEventsReader from './useCalendarsEventsReader';

interface CalendarsEventsFetcherProps {
    calendars: VisualCalendar[];
    calendarsEventsCacheRef: MutableRefObject<CalendarsEventsCache>;
    getOpenedMailEvents: () => OpenedMailEvent[];
    initialDateRange: [Date, Date];
    initializeCacheOnlyCalendarsIDs: string[];
    onCacheInitialized: () => void;
    tzid: string;
}

const useCalendarsEventsFetcher = ({
    calendars,
    calendarsEventsCacheRef,
    initializeCacheOnlyCalendarsIDs,
    initialDateRange,
    getOpenedMailEvents,
    onCacheInitialized,
    tzid,
}: CalendarsEventsFetcherProps) => {
    const calendarsEventsCache = calendarsEventsCacheRef.current;
    const [isLoading, setIsLoading] = useState(true);
    const api = useApi();

    let isActive: boolean;

    const done = () => {
        if (isActive) {
            setIsLoading(false);
            // even if some promise is rejected, consider cache initialized
            onCacheInitialized();
        }
    };

    const isPrefetchEnabled = useFlag('CalendarEventsPrefetch');

    const fetchEventsInDateRange = (range: [Date, Date]) =>
        calendars
            .map(({ ID: calendarID }) => {
                let calendarEventsCache = calendarsEventsCache.calendars[calendarID];

                if (!calendarEventsCache) {
                    calendarEventsCache = getCalendarEventsCache();
                    calendarsEventsCache.calendars[calendarID] = calendarEventsCache;
                }

                return fetchCalendarEvents({
                    api: getSilentApi(api),
                    calendarEventsCache,
                    calendarID,
                    dateRange: range,
                    getOpenedMailEvents,
                    metadataOnly: true,
                    noFetch: initializeCacheOnlyCalendarsIDs.includes(calendarID),
                    tzid,
                });
            })
            .filter(isTruthy);

    const { setCalendarEvents } = useCalendarsEventsReader({
        calendarsEventsCacheRef,
        getOpenedMailEvents,
        metadataOnly: true,
        rerender: () => {},
    });

    const prefetchCalendarEvents = async (range: [Date, Date]) => {
        if (isPrefetchEnabled) {
            const eventsFetchedInDateRange = fetchEventsInDateRange(range);

            if (eventsFetchedInDateRange.length === 0) {
                return;
            }

            // await Promise.all(eventsFetchedInDateRange).finally(done);
            await Promise.all(fetchEventsInDateRange(range))
                .then(() => {
                    const events = getCalendarEvents({ calendars, calendarsEventsCacheRef, dateRange: range, tzid });
                    setCalendarEvents(events);
                })
                .finally(done);
        }
    };

    useEffect(() => {
        const eventsFetchedInDateRange = fetchEventsInDateRange(initialDateRange);

        if (eventsFetchedInDateRange.length === 0) {
            setIsLoading(false);
            return;
        }

        isActive = true;
        setIsLoading(true);

        const done = () => {
            if (isActive) {
                setIsLoading(false);
                // even if some promise is rejected, consider cache initialized
                onCacheInitialized();
            }
        };

        void Promise.all(eventsFetchedInDateRange).finally(done);

        return () => {
            isActive = false;
        };
    }, [calendars, initialDateRange]);

    return {
        isLoading,
        prefetchCalendarEvents,
    };
};

export default useCalendarsEventsFetcher;
