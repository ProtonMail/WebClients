import { store } from 'proton-pass-web/app/Store/store';

import { createCoreTelemetryService } from '@proton/pass/lib/telemetry/service';
import { selectTelemetryEnabled, selectUserTier } from '@proton/pass/store/selectors';
import { createDispatcherAlarm } from '@proton/pass/utils/event/alarm';

export const telemetry = createCoreTelemetryService({
    alarm: createDispatcherAlarm(),
    storage: localStorage,
    getEnabled: () => selectTelemetryEnabled(store.getState()),
    getUserTier: () => selectUserTier(store.getState()),
});
