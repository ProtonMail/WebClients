/**
 * Waits for specific condition to be true
 */
export const waitUntil = (conditionFn: () => boolean) => {
    return new Promise((resolve) => {
        const waitForCondition = () => {
            if (conditionFn()) return resolve();
            setTimeout(waitForCondition, 50);
        };

        waitForCondition();
    });
};
