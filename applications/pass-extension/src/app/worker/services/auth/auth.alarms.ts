import { type BrowserAlarm, createBrowserAlarm } from 'proton-pass-extension/lib/utils/alarm';

import { SESSION_RESUME_MAX_RETRIES, SESSION_RESUME_RETRY_TIMEOUT } from '@proton/pass/constants';
import { logger } from '@proton/pass/utils/logger';
import { epochToMs, getEpoch } from '@proton/pass/utils/time/epoch';
import { FIBONACCI_LIST } from '@proton/shared/lib/constants';

export interface AuthAlarms {
    autoLockAlarm: BrowserAlarm;
    autoResumeAlarm: BrowserAlarm;
    clearAutoLock: () => Promise<void>;
    clearAutoResume: () => Promise<void>;
    setAutoLock: (ttl: number) => Promise<void>;
    setAutoResume: (retryCount: number) => Promise<void>;
}

export const SESSION_RESUME_ALARM = 'alarm::session-resume';
export const SESSION_LOCK_ALARM = 'alarm::session-lock';

export const getAutoResumeDelay = (retryCount: number) => {
    const retryIdx = Math.min(retryCount, FIBONACCI_LIST.length - 1);
    return SESSION_RESUME_RETRY_TIMEOUT * FIBONACCI_LIST[retryIdx];
};

export const createAuthAlarms = (): AuthAlarms => {
    const autoResumeAlarm = createBrowserAlarm(SESSION_RESUME_ALARM);
    const autoLockAlarm = createBrowserAlarm(SESSION_LOCK_ALARM);

    return {
        autoLockAlarm,
        autoResumeAlarm,

        clearAutoLock: async () => {
            logger.info(`[AuthAlarms] Clearing auto-lock alarm`);
            await autoLockAlarm.reset();
        },

        clearAutoResume: async () => {
            logger.info(`[AuthAlarms] Clearing auto-resume alarm`);
            await autoResumeAlarm.reset();
        },

        setAutoResume: async (retryCount) => {
            await autoResumeAlarm.reset();
            const delay = getAutoResumeDelay(retryCount);
            const when = epochToMs(getEpoch() + delay);
            const retryInfo = `(${retryCount}/${SESSION_RESUME_MAX_RETRIES})`;

            logger.info(`[AuthAlarms] Retrying session resume in ${delay}s ${retryInfo}`);
            await autoResumeAlarm.set(when);
        },

        setAutoLock: async (ttl) => {
            await autoLockAlarm.reset();
            const when = epochToMs(getEpoch() + ttl);

            logger.info(`[AuthAlarms] Creating auto-lock alarm [${ttl}s]`);
            await autoLockAlarm.set(when);
        },
    };
};
