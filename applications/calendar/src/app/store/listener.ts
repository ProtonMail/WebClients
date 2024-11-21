import { startPersistListener } from '@proton/account';
import { startCalendarEventListener, startHolidaysDirectoryListener } from '@proton/calendar';
import { startSharedListening } from '@proton/redux-shared-store/sharedListeners';

import { startListeningBusySlots } from './busySlots/busySlotsListeners';
import type { AppStartListening, CalendarState } from './store';

export const start = ({
    startListening,
    persistTransformer,
}: {
    startListening: AppStartListening;
    persistTransformer?: (state: CalendarState) => any;
}) => {
    startSharedListening(startListening);
    startCalendarEventListener(startListening);
    startHolidaysDirectoryListener(startListening);
    startListeningBusySlots(startListening);
    if (persistTransformer) {
        startPersistListener(startListening, persistTransformer);
    }
};
