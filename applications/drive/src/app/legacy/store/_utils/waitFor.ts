const DEFAULT_TIMEOUT = 0;
const DEFAULT_WAIT_TIME = 50;

interface Options {
    timeout?: number;
    waitTime?: number;
    abortSignal?: AbortSignal;
}

/**
 * waitFor runs every few millisecond to check if the condition from `callback`
 * is met and thus waiting time finished. The options can specify custom time
 * for how long to wait between tries, or set timeout or abortSignal.
 */
export default function waitFor(callback: () => boolean, options?: Options): Promise<void> {
    const timeout = options?.timeout || DEFAULT_TIMEOUT;
    const waitTime = options?.waitTime || DEFAULT_WAIT_TIME;
    const abortSignal = options?.abortSignal;

    return new Promise((resolve, reject) => {
        let time = 0;
        const waitForCondition = () => {
            if (abortSignal?.aborted) {
                // Replace with reject(abortSignal.reason) once supported by browsers.
                return reject(new DOMException('Aborted', 'AbortError'));
            }
            if (callback()) {
                return resolve();
            }
            if (timeout > 0 && time > timeout) {
                return reject(new Error('Condition was not met in time'));
            }
            time += waitTime;
            setTimeout(waitForCondition, waitTime);
        };
        waitForCondition();
    });
}
