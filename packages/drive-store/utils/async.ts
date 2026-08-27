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
