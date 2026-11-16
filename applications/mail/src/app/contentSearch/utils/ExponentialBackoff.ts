import { AsyncAbort } from './AsyncAbort';

export interface Timers {
    setTimeout(callback: () => void, ms: number): unknown;
    clearTimeout(handle: unknown): void;
}

const nativeTimers: Timers = {
    setTimeout: (callback, ms) => {
        return setTimeout(callback, ms);
    },
    clearTimeout: (handle) => {
        clearTimeout(handle as ReturnType<typeof setTimeout>);
    },
};

/**
 * Waits before retrying something that isn't ready yet: each wait doubles the previous delay, up to `maxDelayMs`,
 * until `reset` starts over from `initialDelayMs`. A wait rejects with the signal's reason as soon as it aborts.
 */
export class ExponentialBackoff {
    private nextDelayMs: number;

    constructor(
        private readonly initialDelayMs: number,
        private readonly maxDelayMs: number,
        private readonly timers: Timers = nativeTimers
    ) {
        this.nextDelayMs = initialDelayMs;
    }

    async wait(abortSignal: AbortSignal) {
        const delayMs = this.nextDelayMs;
        this.nextDelayMs = Math.min(delayMs * 2, this.maxDelayMs);
        const abort = new AsyncAbort([abortSignal]);
        let timeout: unknown;
        try {
            await Promise.race([
                new Promise<void>((resolve) => {
                    timeout = this.timers.setTimeout(resolve, delayMs);
                }),
                abort.promise,
            ]);
        } finally {
            this.timers.clearTimeout(timeout);
            abort.dispose();
        }
    }

    reset() {
        this.nextDelayMs = this.initialDelayMs;
    }
}
