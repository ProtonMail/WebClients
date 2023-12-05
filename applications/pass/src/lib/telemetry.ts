import { type TelemetryAlarmHandles, createCoreTelemetryService } from '@proton/pass/lib/telemetry/service';
import { selectTelemetryEnabled, selectUserTier } from '@proton/pass/store/selectors';
import { getEpoch } from '@proton/pass/utils/time/get-epoch';

import { store } from '../app/Store/store';

export const telemetry = createCoreTelemetryService({
    alarm: ((): TelemetryAlarmHandles => {
        type TimeoutAlarm = { timer?: NodeJS.Timeout; scheduledTime?: number };
        const alarm: TimeoutAlarm = {};

        return {
            reset: () => {
                clearTimeout(alarm.timer);
                delete alarm.timer;
                delete alarm.scheduledTime;
            },
            when: () => alarm?.scheduledTime,
            set: (when, onAlarm) => {
                /** convert the UNIX milliseconds timestamp back to
                 * a standard timeout delay value in milliseconds */
                const now = getEpoch() * 1_000;
                const ms = when - now;

                alarm.scheduledTime = when;
                clearTimeout(alarm.timer);
                alarm.timer = setTimeout(onAlarm, ms);
            },
        };
    })(),
    getEnabled: () => selectTelemetryEnabled(store.getState()),
    getUserTier: () => selectUserTier(store.getState()),
    storage: localStorage,
});
