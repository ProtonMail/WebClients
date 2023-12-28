import { startCalendarEventListener, startHolidayCalendarsListener } from '@proton/calendar';
import { startSharedListening } from '@proton/redux-shared-store/sharedListeners';

import type { AppStartListening } from './store';

export const start = (startListening: AppStartListening) => {
    startSharedListening(startListening);
    startCalendarEventListener(startListening);
    startHolidayCalendarsListener(startListening);
};
