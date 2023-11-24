import { wait } from '@proton/shared/lib/helpers/promise';

type Params<T> = {
    fn: (...args: any) => Promise<T>;
    beforeRetryCallback?: () => Promise<unknown[] | void>;
    shouldRetryBasedOnError: (e: unknown) => boolean;
    maxRetriesNumber: number;
    backoff?: boolean;
};

function fibonacciExponentialBackoff(attempt: number) {
    const initialDelay = 30 * 1000; // Initial delay in seconds

    let delay = initialDelay;
    let prevDelay = initialDelay;

    for (let i = 2; i <= attempt; i++) {
        const temp = delay;
        delay = delay + prevDelay;
        prevDelay = temp;
    }

    return delay;
}

/**
 * @param {Object} config
 * @param config.fn - The main async function to execute/retry on failure
 * @param config.beforeRetryCallback - The function to execute before retry attempt; Allows to update parameters
 * for the main function by returning then in an arrray
 * @param config.shouldRetryBasedOnError – Error validation function. If returns true, the main callback's
 * considered ready to be executed again
 * @param {number} config.maxRetriesNumber - number of retries until the exection fails
 */
const retryOnError = <ReturnType>({
    fn,
    beforeRetryCallback,
    shouldRetryBasedOnError,
    maxRetriesNumber,
    backoff = false,
}: Params<ReturnType>): ((...args: any) => Promise<ReturnType>) => {
    let retryCount = maxRetriesNumber;

    const retry = async (...args: any): Promise<ReturnType> => {
        try {
            return await fn(...args);
        } catch (error) {
            if (retryCount > 0 && shouldRetryBasedOnError(error)) {
                retryCount--;

                if (beforeRetryCallback) {
                    const newParams = await beforeRetryCallback();
                    if (newParams) {
                        if (backoff) {
                            await wait(fibonacciExponentialBackoff(maxRetriesNumber - retryCount));
                        }
                        return retry(newParams);
                    }
                }

                if (backoff) {
                    await wait(fibonacciExponentialBackoff(maxRetriesNumber - retryCount));
                }
                return retry(...args);
            }

            throw error;
        }
    };

    return retry;
};

export default retryOnError;
