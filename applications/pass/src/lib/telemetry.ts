import { store } from 'proton-pass-web/app/Store/store';

import { authStore } from '@proton/pass/lib/auth/store';
import { createCoreTelemetryService } from '@proton/pass/lib/telemetry/service';
import { selectTelemetryEnabled, selectUserTier } from '@proton/pass/store/selectors';
import { createDispatcherAlarm } from '@proton/pass/utils/event/alarm';

/* remove legacy telemetry storage */
if (!DESKTOP_BUILD) localStorage.removeItem('telemetry');

export const getTelemetryStorageKey = (localID?: number) =>
    localID !== undefined && !DESKTOP_BUILD ? `telemetry::${localID}` : 'telemetry';

export const telemetry = createCoreTelemetryService({
    alarm: createDispatcherAlarm(),
    storage: localStorage,
    getEnabled: () => selectTelemetryEnabled(store.getState()),
    getUserTier: () => selectUserTier(store.getState()),
    getStorageKey: () => getTelemetryStorageKey(authStore.getLocalID()),
});
