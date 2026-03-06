/**
 * Returns a Promise that resolves after `ms` milliseconds, or rejects with an
 * AbortError if the signal is aborted before the timer fires.
 * Used by timer-based states so the core loop can abort them cleanly.
 */
export function abortableDelay(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        if (signal.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
        }
        const id = setTimeout(resolve, ms);
        signal.addEventListener(
            'abort',
            () => {
                clearTimeout(id);
                reject(new DOMException('Aborted', 'AbortError'));
            },
            { once: true }
        );
    });
}
