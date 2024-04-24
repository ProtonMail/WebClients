/**
 * Waits for specific condition to be true.
 * The promise is rejected if the signal is aborted.
 */
export const waitUntil = (conditionFn: () => boolean, abortSignal?: AbortSignal) => {
    return new Promise<void>((resolve, reject) => {
        const waitForCondition = () => {
            if (abortSignal?.aborted) {
                return reject(new Error('Wait aborted'));
            }
            if (conditionFn()) {
                return resolve();
            }
            setTimeout(waitForCondition, 50);
        };

        waitForCondition();
    });
};

export const getSuccessfulSettled = <T>(results: PromiseSettledResult<T>[]) => {
    const values: T[] = [];
    results.forEach((result) => {
        if (result.status === 'fulfilled') {
            values.push(result.value);
        } else {
            console.error(result.reason);
        }
    });
    return values;
};

export const logSettledErrors = <T>(results: PromiseSettledResult<T>[]) => {
    results.forEach((result) => {
        if (result.status === 'rejected') {
            console.error(result.reason);
        }
    });
};
