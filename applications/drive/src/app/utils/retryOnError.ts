type Params<T> = {
    fn: (...args: any) => Promise<T>;
    beforeRetryCallback?: () => Promise<unknown[] | void>;
    shouldRetryBasedOnError: (e: unknown) => boolean;
    maxRetriesNumber: number;
};

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
}: Params<ReturnType>): ((...args: any) => Promise<ReturnType>) => {
    let retryCount = maxRetriesNumber;
    const run = async (...args: any): Promise<ReturnType> => {
        try {
            const res = await fn(...args);
            return res;
        } catch (e) {
            if (retryCount > 0 && shouldRetryBasedOnError(e)) {
                retryCount -= 1;
                if (beforeRetryCallback) {
                    const newParams = await beforeRetryCallback();
                    if (newParams) {
                        return run(newParams);
                    }
                }
                return run(...args);
            }

            throw e;
        }
    };

    return run;
};

export default retryOnError;
