import { createCoreTelemetryService } from '@proton/pass/lib/telemetry/service';
import { selectTelemetryEnabled, selectUserTier } from '@proton/pass/store/selectors';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';

import { store } from '../app/Store/store';

let timerId: NodeJS.Timeout | null = null;
let remainingTime: number | undefined = undefined;
const stopTimer = () => {
    if (timerId) {
        clearTimeout(timerId);
        timerId = null;
    }
};

export const telemetry = createCoreTelemetryService({
    alarm: {
        reset: () => {
            stopTimer();
            return Promise.resolve();
        },
        when: () => {
            return remainingTime ? remainingTime - getEpoch() : undefined;
        },
        set: (when, send) => {
            stopTimer();
            timerId = setTimeout(async () => {
                // Execute onAlarm logic
                await send();
            }, when);

            return Promise.resolve();
        },
    },
    getEnabled: () => selectTelemetryEnabled(store.getState()),
    getUserTier: () => selectUserTier(store.getState()),
    storage: localStorage,
});
