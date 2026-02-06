import { startAccountSessionsListener, startPersistListener } from '@proton/account';
import { startCalendarEventListener } from '@proton/calendar/startCalendarEventListener';
import { startHolidaysDirectoryListener } from '@proton/calendar/startHolidaysDirectoryListener';
import { calendarSettingsHeartbeatListener } from '@proton/redux-shared-store';
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
    calendarSettingsHeartbeatListener(startListening);
    if (features?.accountPersist) {
        startPersistListener(startListening, getCalendarPersistedState);
    }
    if (features?.accountSessions) {
        startAccountSessionsListener(startListening);
    }
};
