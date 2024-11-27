import type { MutableRefObject } from 'react';
import { useEffect, useMemo, useState } from 'react';

import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import useFlag from '@proton/unleash/useFlag';

import type { OpenedMailEvent } from '../../../hooks/useGetOpenedMailEvents';
import { visualEventsSelector } from '../../../store/events/eventsSelectors';
import { eventsActions } from '../../../store/events/eventsSlice';
import { useCalendarDispatch, useCalendarSelector } from '../../../store/hooks';
import type { CalendarViewEvent } from '../interface';
import { getCalendarEvents } from './getCalendarEvents';
import type { CalendarsEventsCache } from './interface';
import { useEventsPrefetch } from './prefetching/useEventsPrefetch';
import useCalendarsEventsFetcher from './useCalendarsEventsFetcher';
import useCalendarsEventsReader from './useCalendarsEventsReader';

interface CalendarEventsProps {
    calendarsEventsCacheRef: MutableRefObject<CalendarsEventsCache>;
    getOpenedMailEvents: () => OpenedMailEvent[];
    initializeCacheOnlyCalendarsIDs: string[];
    onCacheInitialized: () => void;
    requestedCalendars: VisualCalendar[];
    tzid: string;
    utcDateRange: [Date, Date];
}

const useCalendarsEvents = ({
    calendarsEventsCacheRef,
    getOpenedMailEvents,
    initializeCacheOnlyCalendarsIDs,
    onCacheInitialized,
    requestedCalendars,
    tzid,
    utcDateRange,
}: CalendarEventsProps): [CalendarViewEvent[], boolean, (range: [Date, Date]) => void] => {
    const hasReduxStore = useFlag('CalendarRedux');

    const dispatch = useCalendarDispatch();
    const events = useCalendarSelector(visualEventsSelector);

    const [rerender, setRerender] = useState<any>();

    const { setCalendarEvents } = useCalendarsEventsReader({
        calendarsEventsCacheRef,
        getOpenedMailEvents,
        metadataOnly: true,
        rerender: () => setRerender({}),
    });

    const { isLoading, prefetchCalendarEvents } = useCalendarsEventsFetcher({
        calendars: requestedCalendars,
        calendarsEventsCacheRef: calendarsEventsCacheRef,
        getOpenedMailEvents,
        initialDateRange: utcDateRange,
        initializeCacheOnlyCalendarsIDs,
        onCacheInitialized,
        tzid,
    });

    useEffect(() => {
        let isActive = true;
        calendarsEventsCacheRef.current.rerender = () => {
            if (isActive) {
                setRerender({});
            }
        };
        return () => {
            calendarsEventsCacheRef.current.rerender = undefined;
            isActive = false;
        };
    }, []);

    useEventsPrefetch({ initialDateRange: utcDateRange, isLoading, prefetchCalendarEvents, tzid });

    const eventsResults = useMemo(
        () =>
            getCalendarEvents({
                calendars: requestedCalendars,
                calendarsEventsCacheRef,
                dateRange: utcDateRange,
                tzid,
            }),
        [rerender, isLoading, tzid, requestedCalendars, utcDateRange]
    );

    useMemo(() => setCalendarEvents(hasReduxStore ? events : eventsResults), [events, eventsResults, hasReduxStore]);

    useEffect(() => {
        if (hasReduxStore) {
            dispatch(eventsActions.synchronizeEvents(eventsResults));
        }
    }, [eventsResults, hasReduxStore]);

    return [hasReduxStore ? events : eventsResults, isLoading, prefetchCalendarEvents];
};

export default useCalendarsEvents;
