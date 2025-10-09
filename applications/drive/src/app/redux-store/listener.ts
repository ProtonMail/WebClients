import { startAccountSessionsListener, startPersistListener } from '@proton/account';
import { startSharedListening } from '@proton/redux-shared-store/sharedListeners';

import { getDrivePersistedState } from './persistReducer';
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
    if (features?.accountPersist) {
        startPersistListener(startListening, getDrivePersistedState);
    }
    if (features?.accountSessions) {
        startAccountSessionsListener(startListening);
    }
};
