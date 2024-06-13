import { startListeningToPlanNameChange, startPersistListener } from '@proton/account';
import { startCalendarEventListener, startHolidaysDirectoryListener } from '@proton/calendar';
import { startAccountSecurityListener } from '@proton/components/components/drawer/views/SecurityCenter/AccountSecurity/slice/accountSecurityListener';
import { startSharedListening } from '@proton/redux-shared-store/sharedListeners';

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
    if (persistTransformer) {
        startPersistListener(startListening, persistTransformer);
    }
};
