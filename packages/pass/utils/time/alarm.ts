import type { Maybe, MaybePromise } from '@proton/pass/types/utils';

/** Alarm creation is abstracted away behind a simple interface
 * allowing both extension alarms and standard timeouts to be
 * used for implementing the event dispatch triggers */
export interface AbstractAlarm {
    /** `when` is a UNIX timestamp in milliseconds.  */
    set: (when: number) => MaybePromise<void>;
    /** Resets the alarm */
    reset: () => MaybePromise<boolean>;
    /** Should return the next scheduled alarm time as a UNIX timestamp in milliseconds */
    when: () => MaybePromise<Maybe<number>>;
}

export type AlarmFactory = (alarmName: string, onAlarm: () => MaybePromise<void>) => AbstractAlarm;

type TimeoutAlarm = {
    timer?: NodeJS.Timeout;
    scheduledTime?: number;
};

export const createTimeoutAlarm: AlarmFactory = (_, onAlarm) => {
    const alarm: TimeoutAlarm = {};

    return {
        reset: () => {
            clearTimeout(alarm.timer);
            delete alarm.timer;
            delete alarm.scheduledTime;
            return true;
        },
        when: () => alarm?.scheduledTime,
        set: (when) => {
            const now = new Date().getTime();
            const ms = when - now;

            alarm.scheduledTime = when;
            clearTimeout(alarm.timer);
            alarm.timer = setTimeout(onAlarm, ms);
        },
    };
};
