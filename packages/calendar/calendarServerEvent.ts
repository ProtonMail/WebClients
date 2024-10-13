import { createAction } from '@reduxjs/toolkit';

import type { CalendarKey, CalendarSettings as tsCalendarSettings } from '@proton/shared/lib/interfaces/calendar';

export interface CalendarEventLoop {
    CalendarKeys?: { ID: string; Key: CalendarKey }[];
    CalendarSettings?: { CalendarSettings: tsCalendarSettings }[];
}

export const calendarServerEvent = createAction('calendar server event', (payload: CalendarEventLoop) => ({ payload }));
