import { MutableRefObject, useEffect } from 'react';
import { useEventManager } from 'react-components';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { CalendarEventWithoutBlob } from 'proton-shared/lib/interfaces/calendar';
import { CalendarsEventsCache } from './interface';
import removeCalendarEventStoreRecord from './cache/removeCalendarEventStoreRecord';
import upsertCalendarApiEventWithoutBlob from './cache/upsertCalendarApiEventWithoutBlobs';

export const useCalendarCacheEventListener = (cacheRef: MutableRefObject<CalendarsEventsCache>) => {
    const { subscribe } = useEventManager();

    useEffect(() => {
        return subscribe(({ CalendarEvents = [], Calendars = [] }) => {
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

            CalendarEvents.forEach(({ ID: EventID, Action, Event }) => {
                if (Action === EVENT_ACTIONS.DELETE) {
                    // The API does not send the calendar id to which this event belongs, so find it
                    const calendarID = Object.keys(calendars).find((calendarID) => {
                        return calendars[calendarID]?.events.has(EventID);
                    });
                    const calendarsEventsCache = calendars[calendarID || 'undefined'];
                    if (!calendarsEventsCache) {
                        return;
                    }
                    removeCalendarEventStoreRecord(EventID, calendarsEventsCache);
                    // TODO: Only increment count if this event happened in the date range we are currently interested in
                    actions++;
                }

                if (Action === EVENT_ACTIONS.UPDATE || Action === EVENT_ACTIONS.CREATE) {
                    const eventData = Event as CalendarEventWithoutBlob;
                    const { CalendarID } = eventData;

                    const calendarsEventsCache = calendars[CalendarID];
                    if (!calendarsEventsCache) {
                        return;
                    }
                    upsertCalendarApiEventWithoutBlob(eventData, calendarsEventsCache);
                    // TODO: Only increment count if this event happened in the date range we are currently interested in
                    actions++;
                }
            });

            if (actions > 0) {
                cache.rerender?.();
            }
        });
    }, []);
};

export default useCalendarCacheEventListener;
