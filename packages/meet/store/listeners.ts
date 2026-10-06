import { startAccountSessionsListener } from '@proton/account/accountSessions';
import { startPersistListener } from '@proton/account/persist/listener';
import { startSharedListening } from '@proton/redux-shared-store/sharedListeners';

import { startMeetTelemetryListeners } from '../telemetry/listeners';
import { meetEventLoopListener } from './meetEventLoop/listener';
import { getMeetPersistedState } from './persistReducer';
import { meetingSnackbarsListener } from './slices/meetingSnackbarsListener';
import { participantCountMismatchListener } from './slices/participantCountMismatchListener';
import type { MeetAppStartListening } from './store';

export const start = ({ startListening, persist }: { startListening: MeetAppStartListening; persist?: boolean }) => {
    startSharedListening(startListening);
    meetingSnackbarsListener(startListening);
    participantCountMismatchListener(startListening);
    startMeetTelemetryListeners(startListening);
    if (persist) {
        startAccountSessionsListener(startListening);
        startPersistListener(startListening, getMeetPersistedState);
        meetEventLoopListener(startListening);
    }
};
