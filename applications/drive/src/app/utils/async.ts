/**
 * Waits for specific condition to be true
 */
export const waitUntil = (conditionFn: () => boolean) => {
    return new Promise<void>((resolve) => {
        const waitForCondition = () => {
            if (conditionFn()) return resolve();
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
