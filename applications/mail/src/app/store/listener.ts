import { startAccountSessionsListener, startListeningToPlanNameChange, startPersistListener } from '@proton/account';
import { startCalendarEventListener, startHolidaysDirectoryListener } from '@proton/calendar';
import { startAccountSecurityListener } from '@proton/components';
import { mailSettingsHeartbeatListener, startSharedListening } from '@proton/redux-shared-store';

import { getMailPersistedState } from './persistReducer';
import type { AppStartListening } from './store';

export const start = ({ startListening }: { startListening: AppStartListening }) => {
    startSharedListening(startListening);
    startCalendarEventListener(startListening);
    startHolidaysDirectoryListener(startListening);
    startAccountSecurityListener(startListening);
    startListeningToPlanNameChange(startListening);
    mailSettingsHeartbeatListener(startListening);
    startPersistListener(startListening, getMailPersistedState);
    startAccountSessionsListener(startListening);
};
