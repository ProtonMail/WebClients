import { withContext } from 'proton-pass-extension/app/worker/context/inject';
import { type BrowserAlarm, createBrowserAlarm } from 'proton-pass-extension/lib/utils/alarm';

import { SESSION_RESUME_MAX_RETRIES, getAutoResumeDelay } from '@proton/pass/lib/auth/scheduler';
import type { MaybeNull } from '@proton/pass/types';
import { asyncLock } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';
import { epochToMs, getEpoch } from '@proton/pass/utils/time/epoch';

export interface AuthAlarms {
    /** Number of real (non-extended) attempts consumed in the current chain. */
    readonly resumeCount: number;
    /** Epoch of the most recent `scheduleAutoResume` call, or `null`
     * if the chain has never been bootstrapped (or was reset). */
    readonly resumeAttemptedAt: MaybeNull<number>;

    autoLockAlarm: BrowserAlarm;
    autoResumeAlarm: BrowserAlarm;
    clearAutoLock: () => Promise<void>;
    clearAutoResume: () => Promise<void>;
    hydrate: () => Promise<void>;
    isResumeThrottled: () => Promise<boolean>;
    registerResumeFailure: () => Promise<void>;
    resetAutoResume: () => Promise<void>;
    scheduleAutoResume: (options: { extend: boolean }) => Promise<void>;
    setAutoLock: (ttl: number) => Promise<void>;
}

export const SESSION_RESUME_ALARM = 'alarm::session-resume';
export const SESSION_LOCK_ALARM = 'alarm::session-lock';

export const createAuthAlarms = (): AuthAlarms => {
    let resumeCount = 0;
    let resumeAttemptedAt: MaybeNull<number> = null;
    let hydrated = false;

    const autoResumeAlarm = createBrowserAlarm(SESSION_RESUME_ALARM);
    const autoLockAlarm = createBrowserAlarm(SESSION_LOCK_ALARM);

    const persist = withContext<() => Promise<void>>(async (ctx) => {
        await ctx.service.storage.session.setItems({
            resumeCount,
            resumeAttemptedAt,
        });
    });

    const hydrate = withContext<() => Promise<void>>(
        asyncLock(async (ctx) => {
            if (!hydrated) {
                const stored = await ctx.service.storage.session.getItems(['resumeCount', 'resumeAttemptedAt']);
                resumeAttemptedAt = stored.resumeAttemptedAt ?? null;
                resumeCount = stored.resumeCount ?? 0;
                hydrated = true;
                logger.debug(`[AuthAlarms] hydrated [attemptedAt:${resumeAttemptedAt}][count:${resumeCount}]`);
            }
        })
    );

    return {
        get resumeCount() {
            return resumeCount;
        },

        get resumeAttemptedAt() {
            return resumeAttemptedAt;
        },

        autoLockAlarm,
        autoResumeAlarm,

        hydrate,

        clearAutoLock: async () => {
            logger.debug(`[AuthAlarms] Clearing auto-lock alarm`);
            await autoLockAlarm.reset();
        },

        clearAutoResume: async () => {
            logger.debug(`[AuthAlarms] Clearing auto-resume alarm`);
            await autoResumeAlarm.reset();
        },

        resetAutoResume: async () => {
            resumeCount = 0;
            resumeAttemptedAt = null;
            await persist();
        },

        registerResumeFailure: async () => {
            resumeAttemptedAt = getEpoch();
            resumeCount = Math.min(resumeCount + 1, SESSION_RESUME_MAX_RETRIES);
            await persist();
        },

        /**
         * - `extend: true` re-arms the chain without consuming a slot. The
         *    delay stays at the current retry slot so successive defers don't
         *    reset the retry index earned by real failures.
         * - `extend: false` counts as a real attempt. Consumes a slot and
         *    advances the backoff progression.
         */
        scheduleAutoResume: async ({ extend }) => {
            await hydrate();

            /** Record every call to keep `isResumeThrottled` gating non-alarm
             * callers even when we don't end up scheduling. */
            resumeAttemptedAt = getEpoch();

            if (resumeCount >= SESSION_RESUME_MAX_RETRIES) {
                logger.info(`[AuthAlarms] Reached max number of resume retries`);
                return persist();
            }

            /** Skip if a resume alarm is already pending. */
            if ((await autoResumeAlarm.when()) !== undefined) {
                logger.debug(`[AuthAlarms] Auto-resume already pending -> skip`);
                return persist();
            }

            const delay = getAutoResumeDelay(resumeCount);
            const when = epochToMs(getEpoch() + delay);
            const retryInfo = `(${resumeCount}/${SESSION_RESUME_MAX_RETRIES})`;

            logger.info(`[AuthAlarms] Retrying session resume in ${delay}s ${retryInfo}`);

            if (!extend) resumeCount++;
            await persist();
            await autoResumeAlarm.set(when);
        },

        /** True while the chain is alive (alarm pending) or within the current
         * backoff slot's window of the last attempt. Converges to the max slot
         * delay at chain exhaustion, preventing non-alarm callers from re-arming. */
        isResumeThrottled: async () => {
            await hydrate();
            if ((await autoResumeAlarm.when()) !== undefined) return true;
            return resumeAttemptedAt !== null && getEpoch() < resumeAttemptedAt + getAutoResumeDelay(resumeCount);
        },

        setAutoLock: async (ttl) => {
            await autoLockAlarm.reset();
            const when = epochToMs(getEpoch() + ttl);

            logger.debug(`[AuthAlarms] Creating auto-lock alarm [${ttl}s]`);
            await autoLockAlarm.set(when);
        },
    };
};
