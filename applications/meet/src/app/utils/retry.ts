import { wait } from '@proton/shared/lib/helpers/promise';

type RetryOptions = {
    /** The delays to wait before each attempt. */
    delayMs?: number[];
    /** Stop retrying and return as soon as an attempt succeeds. */
    stopAfterFirstSuccess?: boolean;
    /** Checked before every attempt; returning false abandons the remaining ones. */
    shouldAttempt?: () => boolean;
    /** Called with the last error once every attempt has failed. */
    onFailure?: (error: unknown) => void;
};

export const DEFAULT_RETRY_DELAYS_MS = [0, 2_000, 5_000];

const DEFAULT_OPTIONS: Required<Pick<RetryOptions, 'delayMs' | 'stopAfterFirstSuccess'>> = {
    delayMs: DEFAULT_RETRY_DELAYS_MS,
    stopAfterFirstSuccess: false,
};

/**
 * Retry a function multiple times based on the provided delays.
 * @param fn - The function to retry.
 * @param options - The retry options.
 * @returns The result of the last successful attempt, or undefined if none succeeded.
 */
export const retry = async <T>(
    fn: () => Promise<T>,
    {
        delayMs = DEFAULT_OPTIONS.delayMs,
        stopAfterFirstSuccess = DEFAULT_OPTIONS.stopAfterFirstSuccess,
        shouldAttempt,
        onFailure,
    }: RetryOptions = DEFAULT_OPTIONS
): Promise<T | undefined> => {
    let result: T | undefined;
    let succeeded = false;
    let lastError: unknown;

    for (const delay of delayMs) {
        if (delay) {
            await wait(delay);
        }
        if (shouldAttempt && !shouldAttempt()) {
            return result;
        }
        try {
            result = await fn();
            succeeded = true;
            if (stopAfterFirstSuccess) {
                return result;
            }
        } catch (error) {
            lastError = error;
        }
    }

    if (!succeeded) {
        onFailure?.(lastError);
    }

    return result;
};
