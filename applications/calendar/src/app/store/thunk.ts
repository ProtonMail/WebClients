import type { NotificationsManager } from '@proton/app-context/notifications/manager';
import type { CalendarModelEventManager } from '@proton/calendar/calendarModelEventManager';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

export interface CalendarThunkArguments extends ProtonThunkArguments {
    calendarModelEventManager: CalendarModelEventManager;
    notificationManager: NotificationsManager;
}

export const extraThunkArguments = {} as CalendarThunkArguments;
