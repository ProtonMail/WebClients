import type { MutableRefObject } from 'react';
import { useEffect, useMemo, useState } from 'react';

import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import type { OpenedMailEvent } from '../../../hooks/useGetOpenedMailEvents';
import { visualEventsSelector } from '../../../store/events/eventsSelectors';
import { eventsActions } from '../../../store/events/eventsSlice';
import { useCalendarDispatch, useCalendarSelector } from '../../../store/hooks';
import type { CalendarViewEvent } from '../interface';
import { getCalendarEvents } from './getCalendarEvents';
import type { CalendarsEventsCache } from './interface';
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
        setCalendarEvents,
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
            // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-CAC7FF
            calendarsEventsCacheRef.current.rerender = undefined;
            isActive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-04115C
    }, []);

    const eventsResults = useMemo(
        () =>
            getCalendarEvents({
                calendars: requestedCalendars,
                calendarsEventsCacheRef,
                dateRange: utcDateRange,
                tzid,
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-D7816B
        [rerender, isLoading, tzid, requestedCalendars, utcDateRange]
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-E7CFBF
    useMemo(() => setCalendarEvents(events), [events, eventsResults]);

    useEffect(() => {
        dispatch(eventsActions.synchronizeEvents(eventsResults));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-22E7F5
    }, [eventsResults]);

    return [events, isLoading, prefetchCalendarEvents];
};

export default useCalendarsEvents;
