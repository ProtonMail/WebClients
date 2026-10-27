const DEFAULT_TIMEOUT_MS = 8000;

export class TimeoutError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TimeoutError';
    }
}

export const withTimeout = <T>(
    promise: Promise<T>,
    label: string,
    timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => {
            timeoutId = setTimeout(
                () => reject(new TimeoutError(`${label} timed out after ${timeoutMs}ms`)),
                timeoutMs
            );
        }),
    ]).finally(() => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    });
};

export const withIdleTimeout = <T>(
    promise: Promise<T>,
    label: string,
    idleTimeoutMs: number,
    getLastActivityAt: () => number
): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => {
            const checkIdle = () => {
                const idleMs = performance.now() - getLastActivityAt();
                if (idleMs >= idleTimeoutMs) {
                    reject(new TimeoutError(`${label} made no progress for ${Math.round(idleMs)}ms`));
                    return;
                }
                timeoutId = setTimeout(checkIdle, idleTimeoutMs - idleMs);
            };
            timeoutId = setTimeout(checkIdle, idleTimeoutMs);
        }),
    ]).finally(() => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    });
};
