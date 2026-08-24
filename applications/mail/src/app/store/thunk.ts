import type { NotificationsManager } from '@proton/app-context/notifications/manager';
import type { CalendarModelEventManager } from '@proton/calendar/calendarModelEventManager';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

export interface MailThunkArguments extends ProtonThunkArguments {
    calendarModelEventManager: CalendarModelEventManager;
    notificationManager: NotificationsManager; // Not available immediately due to <NotificationManagerInjector />
}

export const extraThunkArguments = {} as MailThunkArguments;
