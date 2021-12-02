type Params<T> = {
    fn: (...args: any) => Promise<T>;
    beforeRetryCallback?: () => Promise<unknown>;
    shouldRetryBasedOnError: (e: unknown) => boolean;
    maxRetriesNumber: number;
};

/**
 * @param {Object} config
 * @param config.fn - The main async function to execute/retry on failure
 * @param config.beforeRetryCallback - The function to execute before retry attempt
 * @param config.shouldRetryBasedOnError – Error validation function. If returns true, the main callback's
 * considered ready to be executed again
 * @param {number} config.maxRetriesNumber - number of retries until the exection fails
 */
const retryOnError = <T>({
    fn,
    beforeRetryCallback,
    shouldRetryBasedOnError,
    maxRetriesNumber,
}: Params<T>): ((...args: any) => Promise<T>) => {
    let retryCount = maxRetriesNumber;
    const run = async (...args: any): Promise<T> => {
        try {
            const res = await fn(...args);
            return res;
        } catch (e) {
            if (retryCount > 0 && shouldRetryBasedOnError(e)) {
                retryCount -= 1;
                if (beforeRetryCallback) {
                    await beforeRetryCallback();
                }
                return run(...args);
            }

            throw e;
        }
    };

    return run;
};

export default retryOnError;
