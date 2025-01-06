import { startAccountSessionsListener, startPersistListener } from '@proton/account';
import { startCalendarEventListener, startHolidaysDirectoryListener } from '@proton/calendar';
import { startSharedListening } from '@proton/redux-shared-store/sharedListeners';

import { startListeningBusySlots } from './busySlots/busySlotsListeners';
import { getCalendarPersistedState } from './persistReducer';
import type { AppStartListening } from './store';

export interface StartListeningFeatures {
    accountPersist?: boolean;
    accountSessions?: boolean;
}

export const start = ({
    startListening,
    features,
}: {
    startListening: AppStartListening;
    features?: StartListeningFeatures;
}) => {
    startSharedListening(startListening);
    startCalendarEventListener(startListening);
    startHolidaysDirectoryListener(startListening);
    startListeningBusySlots(startListening);
    if (features?.accountPersist) {
        startPersistListener(startListening, getCalendarPersistedState);
    }
    if (features?.accountSessions) {
        startAccountSessionsListener(startListening);
    }
};
