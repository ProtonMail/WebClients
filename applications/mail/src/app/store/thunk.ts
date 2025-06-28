import type { CalendarModelEventManager } from '@proton/calendar';
import type { NotificationsManager } from '@proton/components/containers/notifications/manager';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

export interface MailThunkArguments extends ProtonThunkArguments {
    calendarModelEventManager: CalendarModelEventManager;
    notificationManager: NotificationsManager; // Not available immediately due to <NotificationManagerInjector />
}

export const extraThunkArguments = {} as MailThunkArguments;
