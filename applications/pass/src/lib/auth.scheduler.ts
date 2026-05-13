import { SESSION_RESUME_MAX_RETRIES, getAutoResumeDelay } from '@proton/pass/lib/auth/scheduler';
import type { MaybeNull } from '@proton/pass/types';
import { getEpoch } from '@proton/pass/utils/time/epoch';

export interface AuthScheduler {
    /** Record a connection-issue failure: advances the retry chain and refreshes
     * the throttle window. `resumeCount` clamps at `SESSION_RESUME_MAX_RETRIES`. */
    attempt: () => void;
    /** Clear the retry chain. Called on login/logout/boot. Successful auth
     * should invalidate any pending cooldown. */
    reset: () => void;
    /** True while inside the current cooldown window. */
    isThrottled: () => boolean;
}

export const createAuthScheduler = (): AuthScheduler => {
    let resumeCount = 0;
    let resumeAttemptedAt: MaybeNull<number> = null;

    const isThrottled = () => {
        if (resumeAttemptedAt === null) return false;
        else return getEpoch() < resumeAttemptedAt + getAutoResumeDelay(resumeCount);
    };

    const attempt = () => {
        resumeAttemptedAt = getEpoch();
        if (resumeCount < SESSION_RESUME_MAX_RETRIES) resumeCount++;
    };

    const reset = () => {
        resumeCount = 0;
        resumeAttemptedAt = null;
    };

    return { attempt, reset, isThrottled };
};
