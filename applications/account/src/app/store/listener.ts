import {
    authenticationListener,
    organizationKeysManagementListener,
    startAccountSessionsListener,
    startListeningToPlanNameChange,
    startPersistListener,
} from '@proton/account';
import { startHostAccountSessionsListener } from '@proton/account/accountSessions/hostListener';
import { startCalendarEventListener, startHolidaysDirectoryListener } from '@proton/calendar';
import { startSharedListening } from '@proton/redux-shared-store/sharedListeners';

import { getAccountPersistedState } from './persistReducer';
import type { AppStartListening } from './store';

export const start = ({
    startListening,
    mode,
}: {
    startListening: AppStartListening;
    mode: 'public' | 'lite' | 'default';
}) => {
    if (mode === 'default') {
        startSharedListening(startListening);
        startCalendarEventListener(startListening);
        startHolidaysDirectoryListener(startListening);
        startPersistListener(startListening, getAccountPersistedState);
        organizationKeysManagementListener(startListening);
        startListeningToPlanNameChange(startListening);
        startHostAccountSessionsListener(startListening);
        startAccountSessionsListener(startListening);
    }

    if (mode === 'lite') {
        authenticationListener(startListening);
    }
};
