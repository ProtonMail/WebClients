import { MutableRefObject, useEffect } from 'react';
import { useEventManager, useCalendarModelEventManager } from '@proton/components';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { CalendarEventManager, CalendarEventsEventManager } from '@proton/shared/lib/interfaces/calendar/EventManager';

import { CalendarsEventsCache } from './interface';
import removeCalendarEventStoreRecord from './cache/removeCalendarEventStoreRecord';
import upsertCalendarApiEventWithoutBlob from './cache/upsertCalendarApiEventWithoutBlobs';

export const useCalendarCacheEventListener = (
    cacheRef: MutableRefObject<CalendarsEventsCache>,
    calendarIDs: string[]
) => {
    const { subscribe: standardSubscribe } = useEventManager();
    const { subscribe: calendarSubscribe } = useCalendarModelEventManager();

    // subscribe to general event loop
    useEffect(() => {
        return standardSubscribe(({ Calendars = [] }: { Calendars?: CalendarEventManager[] }) => {
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
    }, []);

    // subscribe to calendar event loop
    useEffect(() => {
        return calendarSubscribe(
            calendarIDs,
            ({ CalendarEvents = [] }: { CalendarEvents?: CalendarEventsEventManager[] }) => {
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
                        const calendarsEventsCache = calendars[calendarID || 'undefined'];
                        if (!calendarsEventsCache) {
                            return;
                        }
                        removeCalendarEventStoreRecord(CalendarEventsChange.ID, calendarsEventsCache);
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
            }
        );
    }, [calendarIDs]);
};

export default useCalendarCacheEventListener;
