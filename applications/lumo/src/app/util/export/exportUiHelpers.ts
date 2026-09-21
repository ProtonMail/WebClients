/** Yield so React can paint loading UI before heavy export work blocks the main thread. */
export async function yieldToMainThreadPaint(): Promise<void> {
    await new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                resolve();
            });
        });
    });
}

/** Yield between long export steps so progress UI stays responsive. */
export async function yieldToMainThread(): Promise<void> {
    const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;

    if (scheduler?.yield) {
        await scheduler.yield();
        return;
    }

    await yieldToMainThreadPaint();
}

/** Limit progress-driven React updates during multi-slide capture. */
export function createThrottledProgressCallback(
    onProgress: (current: number, total: number) => void,
    intervalMs = 400
): (current: number, total: number) => void {
    let lastUpdateMs = 0;
    let latestCurrent = 0;
    let latestTotal = 0;
    let pendingTimeout: ReturnType<typeof setTimeout> | null = null;

    const flush = () => {
        pendingTimeout = null;
        onProgress(latestCurrent, latestTotal);
        lastUpdateMs = Date.now();
    };

    return (current: number, total: number) => {
        latestCurrent = current;
        latestTotal = total;
        const now = Date.now();
        const shouldFlushNow = current >= total || current <= 1 || now - lastUpdateMs >= intervalMs;

        if (shouldFlushNow) {
            if (pendingTimeout) {
                clearTimeout(pendingTimeout);
                pendingTimeout = null;
            }
            flush();
            return;
        }

        if (!pendingTimeout) {
            pendingTimeout = setTimeout(flush, intervalMs);
        }
    };
}
