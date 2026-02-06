import type { CalendarModelEventManager } from '@proton/calendar/calendarModelEventManager';
import type { NotificationsManager } from '@proton/components/containers/notifications/manager';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

export interface CalendarThunkArguments extends ProtonThunkArguments {
    calendarModelEventManager: CalendarModelEventManager;
    notificationManager: NotificationsManager;
}

export const extraThunkArguments = {} as CalendarThunkArguments;
