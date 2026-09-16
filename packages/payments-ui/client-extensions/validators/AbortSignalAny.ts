export function abortSignalAnyPolyfill(signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();

    if (signals.length === 0) {
        return controller.signal;
    }

    let isAborted = false;
    const listeners: [AbortSignal, () => void][] = [];

    const cleanup = (): void => {
        listeners.forEach(([signal, listener]) => {
            signal.removeEventListener('abort', listener);
        });
    };

    const abort = (reason?: any): void => {
        if (isAborted) {
            return;
        }

        isAborted = true;
        controller.abort(reason);
        cleanup();
    };

    // Add listeners first to avoid race conditions
    for (const signal of signals) {
        const listener = (): void => abort(signal.reason);
        signal.addEventListener('abort', listener);
        listeners.push([signal, listener]);
    }

    // Then check for already aborted signals
    for (const signal of signals) {
        if (signal.aborted) {
            abort(signal.reason);
            break;
        }
    }

    // Clean up when our signal aborts (from external abort call)
    controller.signal.addEventListener('abort', cleanup, { once: true });

    return controller.signal;
}

// Maybe we can remove it by 2028. At that point even browsers that were't updated for 4 years will support
// AbortSignal.any.
export const abortSignalAny = typeof AbortSignal.any === 'function' ? AbortSignal.any : abortSignalAnyPolyfill;
