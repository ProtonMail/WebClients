import type { MutableRefObject } from 'react';
import { useEffect } from 'react';

import { useCalendarModelEventManager } from '@proton/components/containers/eventManager/calendar/CalendarModelEventManagerProvider';
import useEventManager from '@proton/components/hooks/useEventManager';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type { CalendarEventManager } from '@proton/shared/lib/interfaces/calendar/EventManager';

import type { OpenedMailEvent } from '../../../hooks/useGetOpenedMailEvents';
import { removeCalendarEventStoreRecord } from './cache/removeCalendarEventStoreRecord';
import upsertCalendarApiEventWithoutBlob from './cache/upsertCalendarApiEventWithoutBlobs';
import type { CalendarsEventsCache } from './interface';

export const useCalendarCacheEventListener = (
    cacheRef: MutableRefObject<CalendarsEventsCache>,
    calendarIDs: string[],
    getOpenedMailEvents: () => OpenedMailEvent[]
) => {
    const { subscribe: coreSubscribe } = useEventManager();
    const { subscribe: calendarSubscribe } = useCalendarModelEventManager();

    // subscribe to general event loop
    useEffect(() => {
        return coreSubscribe(({ Calendars = [] }: { Calendars?: CalendarEventManager[] }) => {
            const cache = cacheRef.current;
            if (!cache) {
                return;
            }
            const { calendars } = cache;

            let actions = 0;

            Calendars.forEach(({ ID: CalendarID, Action }) => {
                if (Action === EVENT_ACTIONS.DELETE) {
                    delete calendars[CalendarID];
                    actions++;
                }
            });

            if (actions) {
                cacheRef.current.rerender?.();
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-02087F
    }, []);

    // subscribe to calendar event loop
    useEffect(() => {
        return calendarSubscribe(calendarIDs, ({ CalendarEvents = [] }) => {
            const cache = cacheRef.current;
            if (!cache) {
                return;
            }
            const { calendars } = cache;

            let actions = 0;

            CalendarEvents.forEach((CalendarEventsChange) => {
                if (CalendarEventsChange.Action === EVENT_ACTIONS.DELETE) {
                    // The API does not send the calendar id to which this event belongs, so find it
                    const calendarID = Object.keys(calendars).find((calendarID) => {
                        return calendars[calendarID]?.events.has(CalendarEventsChange.ID);
                    });
                    if (!calendarID) {
                        return;
                    }
                    const calendarsEventsCache = calendars[calendarID];
                    if (!calendarsEventsCache) {
                        return;
                    }
                    removeCalendarEventStoreRecord(CalendarEventsChange.ID, calendarsEventsCache, getOpenedMailEvents);
                    // TODO: Only increment count if this event happened in the date range we are currently interested in
                    actions++;
                }

                if (
                    CalendarEventsChange.Action === EVENT_ACTIONS.UPDATE ||
                    CalendarEventsChange.Action === EVENT_ACTIONS.CREATE
                ) {
                    const { CalendarID } = CalendarEventsChange.Event;

                    const calendarsEventsCache = calendars[CalendarID];
                    if (!calendarsEventsCache) {
                        return;
                    }
                    upsertCalendarApiEventWithoutBlob(CalendarEventsChange.Event, calendarsEventsCache);
                    // TODO: Only increment count if this event happened in the date range we are currently interested in
                    actions++;
                }
            });

            if (actions > 0) {
                cache.rerender?.();
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-36460B
    }, [calendarIDs]);
};

export default useCalendarCacheEventListener;
