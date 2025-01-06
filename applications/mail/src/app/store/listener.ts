import { startAccountSessionsListener, startListeningToPlanNameChange, startPersistListener } from '@proton/account';
import { startCalendarEventListener, startHolidaysDirectoryListener } from '@proton/calendar';
import { startAccountSecurityListener } from '@proton/components';
import { mailSettingsHeartbeatListener, startSharedListening } from '@proton/redux-shared-store';

import { getMailPersistedState } from './persistReducer';
import type { AppStartListening } from './store';

export interface StartListeningFeatures {
    accountPersist?: boolean;
    accountSessions?: boolean;
    accountSecurity?: boolean;
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
    if (features?.accountSecurity) {
        startAccountSecurityListener(startListening);
    }
    startListeningToPlanNameChange(startListening);
    mailSettingsHeartbeatListener(startListening);
    if (features?.accountPersist) {
        startPersistListener(startListening, getMailPersistedState);
    }
    if (features?.accountSessions) {
        startAccountSessionsListener(startListening);
    }
};
