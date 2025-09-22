import { store } from 'proton-pass-web/app/Store/store';
import { getTelemetryStorageKey } from 'proton-pass-web/lib/storage';

import { authStore } from '@proton/pass/lib/auth/store';
import type { TelemetryService } from '@proton/pass/lib/telemetry/service';
import { createCoreTelemetryService } from '@proton/pass/lib/telemetry/service';
import { selectTelemetryEnabled, selectUserTier } from '@proton/pass/store/selectors';
import { createTimeoutAlarm } from '@proton/pass/utils/time/alarm';

export const telemetry = (() => {
    const service: TelemetryService = createCoreTelemetryService({
        alarm: createTimeoutAlarm('telemetry', () => service.send()),
        storage: localStorage,
        getEnabled: () => selectTelemetryEnabled(store.getState()),
        getUserTier: () => selectUserTier(store.getState()),
        getStorageKey: () => getTelemetryStorageKey(authStore.getLocalID()),
    });

    return service;
})();
