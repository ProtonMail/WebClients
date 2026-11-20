/** Helpers for tests that never wait on a promise that may not settle. */
export const deferred = <T = void>() => {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};

/** let pending microtasks _and_ timers run, so anything that can settle has settled */
export const flush = async (turns = 5) => {
    for (let i = 0; i < turns; i++) {
        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });
    }
};

/** observe a promise without awaiting it, so a promise that never settles fails an assertion instead of hanging the test */
export const track = <T>(promise: Promise<T>) => {
    const state = { settled: false, rejected: false, error: undefined as unknown };
    const tracked = promise.then(
        (value) => {
            state.settled = true;
            return value;
        },
        (error) => {
            state.settled = true;
            state.rejected = true;
            state.error = error;
        }
    );
    return { state, done: tracked };
};

/** indexing callback that hangs until aborted, then reports the abort the way a real worker would */
export const abortableIndexing = (onStart?: () => void) => {
    return async (signal: AbortSignal) => {
        onStart?.();
        await new Promise<void>((_, reject) => {
            signal.addEventListener('abort', () => {
                reject(signal.reason);
            });
        });
    };
};
