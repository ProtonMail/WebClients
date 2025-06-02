import { c } from 'ttag';

export function withTimeout(timeoutMs: number, originalSignal?: AbortSignal) {
    let isTimeout = false;
    const timeoutController = new AbortController();

    const timeoutHandle = setTimeout(() => {
        isTimeout = true;
        timeoutController.abort();
    }, timeoutMs);

    const originalSignalAborted = () => {
        timeoutController.abort();
        clearTimeout(timeoutHandle);
    };
    originalSignal?.addEventListener('abort', originalSignalAborted);
    const cleanListeners = () => {
        clearTimeout(timeoutHandle);
        originalSignal?.removeEventListener('abort', originalSignalAborted);
    };

    const callWithTimeout = async (promise: Promise<Response | void>): Promise<Response | void> => {
        try {
            const result = await promise;
            cleanListeners();
            return result;
        } catch (error: unknown) {
            cleanListeners();
            if (isTimeout) {
                throw new TimeoutError(c('Error').t`Request timed out`);
            }
            throw error;
        }
    };

    return {
        signalWithTimeout: timeoutController.signal,
        callWithTimeout,
    };
}

class TimeoutError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TimeoutError';
    }
}
