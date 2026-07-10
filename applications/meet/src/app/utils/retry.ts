import { wait } from '@proton/shared/lib/helpers/promise';

type RetryOptions = {
    /** The delays to wait before each attempt. */
    delayMs?: number[];
    /** Stop retrying and return as soon as an attempt succeeds. */
    stopAfterFirstSuccess?: boolean;
};

const DEFAULT_OPTIONS: Required<RetryOptions> = {
    delayMs: [0, 2_000, 5_000],
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
    }: RetryOptions = DEFAULT_OPTIONS
): Promise<T | undefined> => {
    let result: T | undefined;

    for (const delay of delayMs) {
        if (delay) {
            await wait(delay);
        }
        try {
            result = await fn();
            if (stopAfterFirstSuccess) {
                return result;
            }
        } catch {}
    }

    return result;
};
