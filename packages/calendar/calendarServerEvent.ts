import { createAction } from '@reduxjs/toolkit';

import type { CalendarKey, CalendarSettings as tsCalendarSettings } from '@proton/shared/lib/interfaces/calendar';
import type {
    CalendarAlarmEventManager,
    CalendarEventsEventManager,
    CalendarSubscriptionEventManager,
    CalendarUrlEventManager,
} from '@proton/shared/lib/interfaces/calendar/EventManager';

export interface CalendarEventLoop {
    CalendarKeys?: { ID: string; Key: CalendarKey }[];
    CalendarSettings?: { CalendarSettings: tsCalendarSettings }[];
    CalendarSubscriptions?: CalendarSubscriptionEventManager[];
    CalendarEvents?: CalendarEventsEventManager[];
    CalendarAlarms?: CalendarAlarmEventManager[];
    CalendarURL?: CalendarUrlEventManager[];
    Refresh?: number;
    More: 0 | 1;
    CalendarModelEventID: string;
}

export const calendarServerEvent = createAction('calendar server event', (payload: CalendarEventLoop) => ({ payload }));
