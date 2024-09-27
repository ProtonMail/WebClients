import { startListeningToPlanNameChange, startPersistListener } from '@proton/account';
import { startCalendarEventListener, startHolidaysDirectoryListener } from '@proton/calendar';
import { startAccountSecurityListener } from '@proton/components';
import { mailSettingsHeartbeatListener, startSharedListening } from '@proton/redux-shared-store';

import type { AppStartListening, MailState } from './store';

export const start = ({
    startListening,
    persistTransformer,
}: {
    startListening: AppStartListening;
    persistTransformer?: (state: MailState) => any;
}) => {
    startSharedListening(startListening);
    startCalendarEventListener(startListening);
    startHolidaysDirectoryListener(startListening);
    startAccountSecurityListener(startListening);
    startListeningToPlanNameChange(startListening);
    mailSettingsHeartbeatListener(startListening);
    if (persistTransformer) {
        startPersistListener(startListening, persistTransformer);
    }
};
