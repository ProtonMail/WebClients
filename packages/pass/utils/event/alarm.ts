import { epochToMs, getEpoch } from '@proton/pass/utils/time/epoch';

import type { EventDispatcherAlarm } from './dispatcher';

export const createDispatcherAlarm = (): EventDispatcherAlarm => {
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
};
