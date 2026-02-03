import type { Alarms } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import type { Maybe } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import type { AlarmFactory } from '@proton/pass/utils/time/alarm';
import { createTimeoutAlarm } from '@proton/pass/utils/time/alarm';
import { MINUTE } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

export interface ExtensionAlarm {
    reset: () => Promise<boolean>;
    when: () => Promise<Maybe<number>>;
    set: (when: number) => Promise<void>;
}

export interface BrowserAlarm extends ExtensionAlarm {
    listen: (handler: () => void) => () => void;
}

/** Creates a browser extension alarm that triggers a callback when fired.
 * Note: Should only be used for tasks >1min as per extension documentation.
 * For shorter delays, use `createTimeoutAlarm` instead. */
export const createBrowserAlarm = (alarmName: string): BrowserAlarm => {
    return {
        reset: () => browser.alarms.clear(alarmName).catch(() => false),
        when: async () => (await browser.alarms.get(alarmName).catch(noop))?.scheduledTime,
        set: (when) => browser.alarms.create(alarmName, { when }).catch(noop),
        listen: (handler) => {
            const listener = ({ name }: Alarms.Alarm) => name === alarmName && handler();
            browser.alarms.onAlarm.addListener(listener);
            return () => browser.alarms.onAlarm.removeListener(listener);
        },
    };
};

/** Creates a browser extension alarm that triggers a callback when fired.
 * Note: Should only be used for tasks >1min as per extension documentation.
 * For shorter delays, use `createTimeoutAlarm` instead. */
export const setupBrowserAlarm: AlarmFactory = (alarmName, onAlarm): BrowserAlarm => {
    const alarm = createBrowserAlarm(alarmName);
    alarm.listen(onAlarm);
    return alarm;
};

/** Creates a hybrid alarm scheduler that automatically chooses between
 * `setTimeout` and browser alarms based on delay duration. Uses `setTimeout`
 * for delays under  1 minute and browser alarms for longer delays */
export const createExtensionAlarm: AlarmFactory = (alarmName, onAlarm): ExtensionAlarm => {
    const timeoutAlarm = createTimeoutAlarm(alarmName, onAlarm);
    const browserAlarm = setupBrowserAlarm(alarmName, onAlarm);

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
