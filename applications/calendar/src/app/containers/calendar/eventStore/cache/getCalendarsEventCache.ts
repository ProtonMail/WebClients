import { CalendarEventsCache, CalendarsEventsCache } from '../interface';
import { getIsCalendarEvent } from './helper';

const getCalendarsEventCache = (): CalendarsEventsCache => {
    const calendarsCache: { [key: string]: CalendarEventsCache } = {};

    const getCachedEvent = (calendarID: string, eventID: string) => {
        const calendarCache = calendarsCache[calendarID];
        if (!calendarCache) {
            return;
        }
        const cachedEvent = calendarCache.events.get(eventID);
        const eventData = cachedEvent?.eventData;
        return eventData && getIsCalendarEvent(eventData) ? eventData : undefined;
    };

    const getCachedRecurringEvent = (calendarID: string, uid: string) => {
        const calendarCache = calendarsCache[calendarID];
        if (!calendarCache) {
            return;
        }
        return calendarCache.recurringEvents.get(uid);
    };

    const ref = 0;
    const isUnmounted = false;

    return {
        ref,
        isUnmounted,
        calendars: calendarsCache,
        getCachedEvent,
        getCachedRecurringEvent,
    };
};

export default getCalendarsEventCache;
