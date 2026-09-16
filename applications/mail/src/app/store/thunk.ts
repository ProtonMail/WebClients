import type { NotificationsManager } from '@proton/app-context/notifications/manager';
import type { CalendarModelEventManager } from '@proton/calendar/calendarModelEventManager';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';

import type { ContentSearchEndReason } from '../contentSearch/metrics/interface';

export interface MailThunkArguments extends ProtonThunkArguments {
    calendarModelEventManager: CalendarModelEventManager;
    notificationManager: NotificationsManager; // Not available immediately due to <NotificationManagerInjector />
    // Not available immediately, and refreshed on every EncryptedSearchProvider render - see there.
    startSearchSession: () => void;
    endSearchSession: (endReason: ContentSearchEndReason) => void;
}

export const extraThunkArguments = {} as MailThunkArguments;
