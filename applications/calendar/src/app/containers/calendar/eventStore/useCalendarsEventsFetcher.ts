import type { MutableRefObject } from 'react';
import { useEffect, useRef } from 'react';

import { useUserSettings } from '@proton/account/index';
import type { DateTuple } from '@proton/components/components/miniCalendar/interface';
import useApi from '@proton/components/hooks/useApi';
import { useLoading } from '@proton/hooks';
import { getSilentApi, getSilentApiWithAbort } from '@proton/shared/lib/api/helpers/customConfig';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';
import useFlag from '@proton/unleash/useFlag';
import isTruthy from '@proton/utils/isTruthy';

import type { OpenedMailEvent } from '../../../hooks/useGetOpenedMailEvents';
import type { CalendarViewEvent } from '../interface';
import { fetchCalendarEvents } from './cache/fetchCalendarEvents';
import getCalendarEventsCache from './cache/getCalendarEventsCache';
import { getCalendarEvents } from './getCalendarEvents';
import type { CalendarsEventsCache } from './interface';
import { getNextDateRange } from './prefetching/getNextDateRange';
import { getPreviousDateRange } from './prefetching/getPreviousDateRange';

interface CalendarsEventsFetcherProps {
    calendars: VisualCalendar[];
    setCalendarEvents: (events: CalendarViewEvent[]) => void;
    calendarsEventsCacheRef: MutableRefObject<CalendarsEventsCache>;
    getOpenedMailEvents: () => OpenedMailEvent[];
    initialDateRange: [Date, Date];
    initializeCacheOnlyCalendarsIDs: string[];
    onCacheInitialized: () => void;
    tzid: string;
}

const cacheAbortControllers = new Map<string, AbortController>();

const getAbortController = (dateRange: DateTuple) => {
    const existingController = cacheAbortControllers.get(dateRange.toString());

    if (existingController) {
        return existingController;
    }

    const newController = new AbortController();
    cacheAbortControllers.set(dateRange.toString(), newController);
    return newController;
};

const cleanUnnecessaryAbortControllers = (dateRanges: DateTuple[]) => {
    const rangesAsString = dateRanges.map((dateRange) => dateRange.toString());
    cacheAbortControllers.entries().forEach(([dateRange, controller]) => {
        if (rangesAsString.includes(dateRange)) {
            return;
        }

        if (controller.signal.aborted) {
            return;
        }

        controller.abort('Abort unnecessary fetch');
        cacheAbortControllers.delete(dateRange);
    });
};

const useCalendarsEventsFetcher = ({
    calendars,
    setCalendarEvents,
    calendarsEventsCacheRef,
    initializeCacheOnlyCalendarsIDs,
    initialDateRange,
    getOpenedMailEvents,
    onCacheInitialized,
    tzid,
}: CalendarsEventsFetcherProps) => {
    const calendarsEventsCache = calendarsEventsCacheRef.current;
    const [isLoading, withLoading] = useLoading();
    const api = useApi();
    const [userSettings] = useUserSettings();
    const weekStartsOn = getWeekStartsOn(userSettings);
    const currentDateRangeRef = useRef(initialDateRange);

    const done = () => {
        // even if some promise is rejected, consider cache initialized
        onCacheInitialized();
        calendarsEventsCacheRef.current.rerender?.();
    };

    const isPrefetchEnabled = useFlag('CalendarEventsPrefetch');

    const fetchEventsInDateRange = (range: DateTuple, abortSignal?: AbortSignal) =>
        calendars
            .map(({ ID: calendarID }) => {
                let calendarEventsCache = calendarsEventsCache.calendars[calendarID];

                if (!calendarEventsCache) {
                    calendarEventsCache = getCalendarEventsCache();
                    calendarsEventsCache.calendars[calendarID] = calendarEventsCache;
                }

                return fetchCalendarEvents({
                    api: abortSignal ? getSilentApiWithAbort(api, abortSignal) : getSilentApi(api),
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

    const prefetchCalendarEvents = async (range: DateTuple, abortSignal?: AbortSignal) => {
        if (isPrefetchEnabled) {
            const eventsFetchedInDateRange = fetchEventsInDateRange(range, abortSignal);

            if (eventsFetchedInDateRange.length === 0) {
                return;
            }

            await Promise.all(fetchEventsInDateRange(range, abortSignal))
                .then(() => {
                    const events = getCalendarEvents({ calendars, calendarsEventsCacheRef, dateRange: range, tzid });
                    setCalendarEvents(events);
                })
                .catch(() => {
                    // Silently catch aborted requests errors
                });
        }
    };

    useEffect(() => {
        currentDateRangeRef.current = initialDateRange;
        const nextDateRange = getNextDateRange(initialDateRange, weekStartsOn, tzid);
        const previousDateRange = getPreviousDateRange(initialDateRange, weekStartsOn, tzid);
        const currentAbortController = getAbortController(initialDateRange);
        const previousAbortController = getAbortController(previousDateRange);
        const nextAbortController = getAbortController(nextDateRange);
        const eventsFetchedInDateRange = fetchEventsInDateRange(initialDateRange, currentAbortController.signal);

        // When the user is navigating quickly between pages, we want to abort useless requests.
        // All requests that are not included in the current page or in the adjacent pages should be canceled.
        cleanUnnecessaryAbortControllers([nextDateRange, initialDateRange, previousDateRange]);

        const prefetchDateRanges = async () => {
            await Promise.all([
                prefetchCalendarEvents(nextDateRange, nextAbortController.signal),
                prefetchCalendarEvents(previousDateRange, previousAbortController.signal),
            ]);
        };

        const currentPromise = Promise.all(eventsFetchedInDateRange).finally(() => {
            /*
             * It's possible to get multiple requests running.
             * E.g., start loading a page and go to the next one.
             * -> First requests will end before the requests of the current page. We should not change isLoading to false.
             */
            if (initialDateRange === currentDateRangeRef.current) {
                done();
            }
        });
        void withLoading(currentPromise).then(prefetchDateRanges);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-EE2950
    }, [calendars, initialDateRange.toString()]);

    return {
        isLoading,
        prefetchCalendarEvents,
    };
};

export default useCalendarsEventsFetcher;
