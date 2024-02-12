import { store } from 'proton-pass-web/app/Store/store';

import { type TelemetryAlarmHandles, createCoreTelemetryService } from '@proton/pass/lib/telemetry/service';
import { selectTelemetryEnabled, selectUserTier } from '@proton/pass/store/selectors';
import { epochToMs, getEpoch } from '@proton/pass/utils/time/epoch';

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
                const now = epochToMs(getEpoch());
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
