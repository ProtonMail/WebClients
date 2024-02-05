import { startCalendarEventListener, startHolidaysDirectoryListener } from '@proton/calendar';
import { startAccountSecurityListener } from '@proton/components/components/drawer/views/SecurityCenter/AccountSecurity/slice/accountSecurityListener';
import { startSharedListening } from '@proton/redux-shared-store/sharedListeners';

import type { AppStartListening } from './store';

export const start = (startListening: AppStartListening) => {
    startSharedListening(startListening);
    startCalendarEventListener(startListening);
    startHolidaysDirectoryListener(startListening);
    startAccountSecurityListener(startListening);
};
