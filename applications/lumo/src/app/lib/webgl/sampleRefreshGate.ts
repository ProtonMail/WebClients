export interface SampleRefreshGate {
    /** True when the cached sample should be refreshed this frame. */
    shouldRefresh: (nowMs: number) => boolean;
    /** Force the next shouldRefresh() to return true (e.g. after a resize). */
    reset: () => void;
}

/**
 * Rate-limits how often the particle pass re-copies the slow-moving blob layer.
 * Refreshes on first call and whenever at least `minIntervalMs` has elapsed.
 */
export function createSampleRefreshGate(minIntervalMs: number): SampleRefreshGate {
    let last: number | null = null;
    return {
        shouldRefresh(nowMs) {
            if (last === null || nowMs - last >= minIntervalMs) {
                last = nowMs;
                return true;
            }
            return false;
        },
        reset() {
            last = null;
        },
    };
}
