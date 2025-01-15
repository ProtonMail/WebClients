export const wait = (delay: number) => new Promise<void>((resolve) => setTimeout(resolve, delay));

/**
 * Runs each chunk from a chunks array and waits after each one has run (unless it's the last one).
 */
export const runChunksDelayed = async <T>(
    chunks: number[][] = [],
    cb: (index: number) => Promise<T>,
    delay: number
) => {
    const promises = [];

    for (let i = 0; i < chunks.length; ++i) {
        promises.push(...chunks[i].map(cb));
        if (i !== chunks.length - 1) {
            await wait(delay);
        }
    }

    return Promise.all(promises);
};

export const createPromise = <T>() => {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: any) => void;

    const promise = new Promise<T>((innerResolve, innerReject) => {
        resolve = innerResolve;
        reject = innerReject;
    });

    return { promise, resolve, reject };
};

/**
 * Options for the promiseWithTimeout function
 */
interface PromiseTimeoutOptions<T> {
    /** The promise to wrap with a timeout */
    promise: Promise<T>;
    /** Timeout duration in milliseconds */
    timeoutMs: number;
    /** Optional error message for timeout */
    errorMessage?: string;
}

/**
 * Wraps a promise with a timeout. The promise will be rejected if it doesn't resolve
 * within the specified timeout duration.
 *
 * @param options - Configuration options
 * @returns A new promise that will reject if the timeout is reached
 *
 */
export async function promiseWithTimeout<T>({
    promise,
    timeoutMs,
    errorMessage = 'Promise timed out',
}: PromiseTimeoutOptions<T>): Promise<T> {
    // Create a promise that rejects after the timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error(errorMessage));
        }, timeoutMs);

        // Clean up the timeout if the original promise resolves/rejects
        void promise.finally(() => clearTimeout(timeoutId));
    });

    // Race between the original promise and the timeout
    return Promise.race([promise, timeoutPromise]);
}
