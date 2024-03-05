import { startCalendarEventListener, startHolidaysDirectoryListener } from '@proton/calendar';
import { startSharedListening } from '@proton/redux-shared-store/sharedListeners';

import { startListeningBusyTimeSlotsAttendees } from './busyTimeSlots/busyTimeSlotsListeners';
import type { AppStartListening } from './store';

export const start = (startListening: AppStartListening) => {
    startSharedListening(startListening);
    startCalendarEventListener(startListening);
    startHolidaysDirectoryListener(startListening);
    startListeningBusyTimeSlotsAttendees(startListening);
};
