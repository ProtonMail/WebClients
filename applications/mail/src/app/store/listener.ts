import {
    startAccountSecurityListener,
    startAccountSessionsListener,
    startListeningToPlanNameChange,
    startPersistListener,
} from '@proton/account';
import { startCalendarEventListener } from '@proton/calendar/calendars/listener';
import { startHolidaysDirectoryListener } from '@proton/calendar/holidaysDirectory/listener';
import { mailSettingsHeartbeatListener } from '@proton/redux-shared-store/mailSettingsHeartbeatListener';
import { startSharedListening } from '@proton/redux-shared-store/sharedListeners';

import { startElementsListener } from './elements/elementsListener';

import { startCategoriesUnseenListener } from './categories/categoriesUnseenListener';
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
    startCategoriesUnseenListener(startListening);
};
