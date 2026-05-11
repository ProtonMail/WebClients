import { SESSION_RESUME_MAX_RETRIES, getAutoResumeDelay } from '@proton/pass/lib/auth/scheduler';
import type { MaybeNull } from '@proton/pass/types';
import { getEpoch } from '@proton/pass/utils/time/epoch';

export interface AuthScheduler {
    /** Record a connection-issue failure: advances the retry chain and refreshes
     * the throttle window. `retryCount` clamps at `SESSION_RESUME_MAX_RETRIES`. */
    attempt: () => void;
    /** Clear the retry chain. Called on login/logout/boot. Successful auth
     * should invalidate any pending cooldown. */
    reset: () => void;
    /** True while inside the current cooldown window. */
    isThrottled: () => boolean;
}

export const createAuthScheduler = (): AuthScheduler => {
    let retryCount = 0;
    let lastAttemptAt: MaybeNull<number> = null;

    const isThrottled = () => {
        if (lastAttemptAt === null) return false;
        else return getEpoch() < lastAttemptAt + getAutoResumeDelay(retryCount);
    };

    const attempt = () => {
        lastAttemptAt = getEpoch();
        if (retryCount < SESSION_RESUME_MAX_RETRIES) retryCount++;
    };

    const reset = () => {
        retryCount = 0;
        lastAttemptAt = null;
    };

    return { attempt, reset, isThrottled };
};
