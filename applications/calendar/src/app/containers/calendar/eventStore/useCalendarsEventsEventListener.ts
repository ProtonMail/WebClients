import { MutableRefObject, useEffect } from 'react';
import { useEventManager } from 'react-components';
import { EVENT_ACTIONS } from 'proton-shared/lib/constants';
import { CalendarsEventsCache } from './interface';
import { removeEventFromCache, setEventInCache } from './cache/cache';

export const useCalendarCacheEventListener = (cacheRef: MutableRefObject<CalendarsEventsCache>) => {
    const { subscribe } = useEventManager();

    useEffect(() => {
        return subscribe(({ CalendarEvents = [], Calendars = [] }) => {
            if (!cacheRef.current) {
                return;
            }
            const cache = cacheRef.current;

            const { calendars } = cache;

            let actions = 0;

            Calendars.forEach(({ ID: CalendarID, Action }) => {
                if (Action === EVENT_ACTIONS.DELETE) {
                    if (calendars[CalendarID]) {
                        delete cacheRef.current.calendars[CalendarID];
                        actions++;
                    }
                }
            });

            CalendarEvents.forEach(({ ID: EventID, Action, Event }) => {
                if (Action === EVENT_ACTIONS.DELETE) {
                    // The API does not send the calendar id to which this event belongs, so find it
                    const calendarID = Object.keys(calendars).find((calendarID) => {
                        return cacheRef.current.calendars[calendarID].events.has(EventID);
                    });
                    if (!calendarID) {
                        return;
                    }
                    removeEventFromCache(EventID, cacheRef.current.calendars[calendarID]);
                    // TODO: Only increment count if this event happened in the date range we are currently interested in
                    actions++;
                }

                if (Action === EVENT_ACTIONS.UPDATE || Action === EVENT_ACTIONS.CREATE) {
                    const { CalendarID } = Event;

                    const calendarCache = cacheRef.current.calendars[CalendarID];
                    if (!calendarCache) {
                        return;
                    }
                    setEventInCache(Event, calendarCache);
                    // TODO: Only increment count if this event happened in the date range we are currently interested in
                    actions++;
                }
            });

            if (actions > 0) {
                cacheRef.current.rerender?.();
            }
        });
    }, []);
};

export default useCalendarCacheEventListener;
