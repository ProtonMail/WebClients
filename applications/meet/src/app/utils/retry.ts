import { wait } from '@proton/shared/lib/helpers/promise';

/**
 * Retry a function multiple times based on the provided delays.
 * @param fn - The function to retry.
 * @param delayMs - The delays to use.
 */
export const retry = async (fn: () => Promise<void>, delayMs: number[] = [0, 2_000, 5_000]) => {
    for (const delay of delayMs) {
        if (delay) {
            await wait(delay);
        }
        try {
            await fn();
        } catch {}
    }
};
