import { startAccountSessionsListener } from '@proton/account/accountSessions';
import { startPersistListener } from '@proton/account/persist/listener';
import { startSharedListening } from '@proton/redux-shared-store/sharedListeners';

import { getMeetPersistedState } from './persistReducer';
import type { MeetAppStartListening } from './store';

export const start = ({ startListening, persist }: { startListening: MeetAppStartListening; persist?: boolean }) => {
    startSharedListening(startListening);
    if (persist) {
        startAccountSessionsListener(startListening);
        startPersistListener(startListening, getMeetPersistedState);
    }
};
