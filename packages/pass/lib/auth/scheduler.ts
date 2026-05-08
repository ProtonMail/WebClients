import { FIBONACCI_LIST } from '@proton/shared/lib/constants';

export const SESSION_RESUME_TIMEOUT_MIN = 15; /* seconds */
export const SESSION_RESUME_MAX_RETRIES = 7;

export const getAutoResumeDelay = (retryCount: number) => {
    const retryIdx = Math.min(retryCount, FIBONACCI_LIST.length - 1);
    return SESSION_RESUME_TIMEOUT_MIN * FIBONACCI_LIST[retryIdx];
};
