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

import type { AccountState, AppStartListening } from './store';

export const start = ({
    startListening,
    persistTransformer,
    mode,
}: {
    startListening: AppStartListening;
    mode: 'public' | 'lite' | 'default';
    persistTransformer: (state: AccountState) => any;
}) => {
    if (mode === 'default') {
        startSharedListening(startListening);
        startCalendarEventListener(startListening);
        startHolidaysDirectoryListener(startListening);
        startPersistListener(startListening, persistTransformer);
        organizationKeysManagementListener(startListening);
        startListeningToPlanNameChange(startListening);
        startHostAccountSessionsListener(startListening);
        startAccountSessionsListener(startListening);
    }

    if (mode === 'lite') {
        authenticationListener(startListening);
    }
};
