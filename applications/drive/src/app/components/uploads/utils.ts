export function getErrorString(error?: any, fallback?: string): string {
    if (error) {
        return error.message || `${error}`;
    }
    return fallback || 'Unkown error';
}

/**
 * callWithAbortSignal runs the callback but rejects with AbortError when
 * the signal is aborted. The original call is not interrupted, though.
 * Use only on places where the original call is not possible to abort
 * and/or when it is fine to continue with the original call.
 */
export function callWithAbortSignal<T>(abortSignal: AbortSignal, callback: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        const listener = () => {
            reject(new AbortError());
        };
        abortSignal.addEventListener('abort', listener);
        callback()
            .then(resolve)
            .catch(reject)
            .finally(() => {
                abortSignal.removeEventListener('abort', listener);
            });
    });
}

class AbortError extends Error {
    constructor() {
        super('Call aborted');
        this.name = 'AbortError';
    }
}
