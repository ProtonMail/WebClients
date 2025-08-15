import {
    authenticationListener,
    convertAddressesListener,
    organizationKeysManagementListener,
    startAccountSessionsListener,
    startListeningToPlanNameChange,
    startPersistListener,
    unprivatizeMembersListener,
} from '@proton/account';
import { startHostAccountSessionsListener } from '@proton/account/accountSessions/hostListener';
import { startCalendarEventListener, startHolidaysDirectoryListener } from '@proton/calendar';
import { startCalendarEventLoopV6Listening } from '@proton/redux-shared-store/eventLoop/calendarEventLoopV6';
import { startContactEventLoopV6Listening } from '@proton/redux-shared-store/eventLoop/contactEventLoopV6';
import { startCoreEventLoopV6Listening } from '@proton/redux-shared-store/eventLoop/coreEventLoopV6';
import { startMailEventLoopV6Listening } from '@proton/redux-shared-store/eventLoop/mailEventLoopV6';
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
        startCoreEventLoopV6Listening(startListening);
        startMailEventLoopV6Listening(startListening);
        startContactEventLoopV6Listening(startListening);
        startCalendarEventLoopV6Listening(startListening);
        startSharedListening(startListening);
        startCalendarEventListener(startListening);
        startHolidaysDirectoryListener(startListening);
        startPersistListener(startListening, getAccountPersistedState);
        organizationKeysManagementListener(startListening);
        startListeningToPlanNameChange(startListening);
        startHostAccountSessionsListener(startListening);
        startAccountSessionsListener(startListening);
        convertAddressesListener(startListening);
        unprivatizeMembersListener(startListening);
    }

    if (mode === 'lite') {
        authenticationListener(startListening);
    }
};
