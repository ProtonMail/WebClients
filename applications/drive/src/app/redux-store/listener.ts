import { startAccountSessionsListener } from '@proton/account/accountSessions/listener';
import { bootstrapEvent } from '@proton/account/bootstrap/action';
import { startPersistListener } from '@proton/account/persist/listener';
import { startOffersDeliveryListener } from '@proton/offers-delivery/store/listener';
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
    startOffersDeliveryListener(startListening, { appReady: bootstrapEvent });
};
