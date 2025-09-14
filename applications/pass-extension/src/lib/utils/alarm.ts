import browser from '@proton/pass/lib/globals/browser';
import { logger } from '@proton/pass/utils/logger';
import type { AlarmFactory } from '@proton/pass/utils/time/alarm';
import { createTimeoutAlarm } from '@proton/pass/utils/time/alarm';
import { MINUTE } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

/** Creates a browser extension alarm that triggers a callback when fired.
 * Note: Should only be used for tasks >1min as per extension documentation.
 * For shorter delays, use `createTimeoutAlarm` instead. */
export const createBrowserAlarm: AlarmFactory = (alarmName, onAlarm) => {
    browser.alarms.onAlarm.addListener(({ name }) => name === alarmName && onAlarm());

    return {
        reset: () => browser.alarms.clear(alarmName).catch(() => false),
        when: async () => (await browser.alarms.get(alarmName).catch(noop))?.scheduledTime,
        set: (when) => browser.alarms.create(alarmName, { when }),
    };
};

/** Creates a hybrid alarm scheduler that automatically chooses between
 * `setTimeout`  and browser alarms based on delay duration. Uses `setTimeout`
 * for delays under  1 minute and browser alarms for longer delays */
export const createExtensionAlarm: AlarmFactory = (alarmName, onAlarm) => {
    const timeoutAlarm = createTimeoutAlarm(alarmName, onAlarm);
    const browserAlarm = createBrowserAlarm(alarmName, onAlarm);

    const reset = async () =>
        Promise.all([timeoutAlarm.reset(), browserAlarm.reset()])
            .then(([a, b]) => a && b)
            .catch(() => false);

    return {
        reset,

        when: async () => {
            return (await timeoutAlarm.when()) ?? (await browserAlarm.when());
        },

        set: async (when) => {
            await reset();

            const now = Date.now();
            const delayMs = when - now;

            if (delayMs < MINUTE) {
                logger.debug(`[Alarm::${alarmName}] using timeout alarm [${when}]`);
                await timeoutAlarm.set(when);
            } else {
                logger.debug(`[Alarm::${alarmName}] using extension alarm [${when}]`);
                await browserAlarm.set(when);
            }
        },
    };
};
