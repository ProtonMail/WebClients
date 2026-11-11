import { startAccountSessionsListener } from '@proton/account/accountSessions/listener';
import { bootstrapEvent } from '@proton/account/bootstrap/action';
import { ktSelfAuditListener } from '@proton/account/kt/selfAuditListener';
import { startPersistListener } from '@proton/account/persist/listener';
import { startCalendarEventListener } from '@proton/calendar/calendars/listener';
import { startHolidaysDirectoryListener } from '@proton/calendar/holidaysDirectory/listener';
import { startOffersDeliveryListener } from '@proton/offers-delivery/store/listener';
import { calendarSettingsHeartbeatListener } from '@proton/redux-shared-store/settingsHeartbeat/calendarSettingsHeartbeatListener';
import { startSharedListening } from '@proton/redux-shared-store/sharedListeners';

import { startListeningBusySlots } from './busySlots/busySlotsListeners';
import { getCalendarPersistedState } from './persistReducer';
import type { AppStartListening } from './store';

export interface StartListeningFeatures {
    accountPersist?: boolean;
    accountSessions?: boolean;
    ktSelfAudit?: boolean;
}

export const start = ({
    startListening,
    features,
}: {
    startListening: AppStartListening;
    features?: StartListeningFeatures;
}) => {
    startSharedListening(startListening);
    startCalendarEventListener(startListening);
    startHolidaysDirectoryListener(startListening);
    startListeningBusySlots(startListening);
    calendarSettingsHeartbeatListener(startListening);
    if (features?.accountPersist) {
        startPersistListener(startListening, getCalendarPersistedState);
    }
    if (features?.accountSessions) {
        startAccountSessionsListener(startListening);
    }
    if (features?.ktSelfAudit) {
        ktSelfAuditListener(startListening);
    }
    startOffersDeliveryListener(startListening, { appReady: bootstrapEvent });
};
