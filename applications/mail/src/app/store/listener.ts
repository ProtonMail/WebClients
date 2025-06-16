import { startAccountSessionsListener, startListeningToPlanNameChange, startPersistListener } from '@proton/account';
import { startCalendarEventListener, startHolidaysDirectoryListener } from '@proton/calendar';
import { startAccountSecurityListener } from '@proton/components';
import { mailSettingsHeartbeatListener, startSharedListening } from '@proton/redux-shared-store';

import { startElementsListener } from 'proton-mail/store/elements/elementsListener';

import { startIncomingDefaultListener } from './incomingDefaults/incomingDefaultListener';
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
    startIncomingDefaultListener(startListening);
    startElementsListener(startListening);
};
