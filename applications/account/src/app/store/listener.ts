import { authenticationListener } from '@proton/account';
import { startCalendarEventListener, startHolidaysDirectoryListener } from '@proton/calendar';
import { startSharedListening } from '@proton/redux-shared-store/sharedListeners';

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
    }

    if (mode === 'lite') {
        authenticationListener(startListening);
    }
};
