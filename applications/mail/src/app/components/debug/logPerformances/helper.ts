import type { MainThreadStats, PhaseBreakdownEntry } from './interface';

const FRAME_BUDGET_MS = 1000 / 60;
/** Long-task entries reach the observer slightly after the task that caused them finishes. */
const OBSERVER_FLUSH_DELAY_MS = 100;

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Answers "did we skip frames" (via rAF deltas) and "did we hang" (via the Long Tasks API). */
export const startMainThreadMonitor = () => {
    let frames = 0;
    let droppedFrames = 0;
    let longestFrameMs = 0;
    let lastFrameAt = performance.now();
    let watching = true;
    let rafId: number;

    const tick = () => {
        const now = performance.now();
        const delta = now - lastFrameAt;
        lastFrameAt = now;
        frames += 1;
        longestFrameMs = Math.max(longestFrameMs, delta);
        if (delta > FRAME_BUDGET_MS) {
            droppedFrames += 1;
        }
        if (watching) {
            rafId = requestAnimationFrame(tick);
        }
    };
    rafId = requestAnimationFrame(tick);

    let longTasks = 0;
    let longestLongTaskMs = 0;
    let totalLongTaskMs = 0;
    const longTaskApiSupported =
        typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes.includes('longtask');
    const observer = longTaskApiSupported
        ? new PerformanceObserver((list) => {
              list.getEntries().forEach((entry) => {
                  longTasks += 1;
                  longestLongTaskMs = Math.max(longestLongTaskMs, entry.duration);
                  totalLongTaskMs += entry.duration;
              });
          })
        : undefined;
    observer?.observe({ entryTypes: ['longtask'] });

    const stop = async (): Promise<MainThreadStats> => {
        await sleep(OBSERVER_FLUSH_DELAY_MS);
        watching = false;
        cancelAnimationFrame(rafId);
        observer?.disconnect();

        return {
            frames,
            droppedFrames,
            longestFrameMs,
            longTaskApiSupported,
            longTasks,
            longestLongTaskMs,
            totalLongTaskMs,
        };
    };

    return { stop };
};

/**
 * Sums the `packages/logger` internal `performance.measure` entries whose name ends with
 * `nameSuffix` and started no earlier than `sinceTimeMs`, then clears them. Matching by suffix
 * rather than the full name keeps this independent of the logger instance's name (`logger-mail`
 * in this app, but not guaranteed); clearing keeps repeated benchmark runs from re-summing
 * entries left over from a previous one.
 */
const captureAndClearMeasure = (nameSuffix: string, sinceTimeMs: number): number => {
    const entries = performance.getEntriesByType('measure').filter((entry) => entry.name.endsWith(nameSuffix));
    const durationMs = entries
        .filter((entry) => entry.startTime >= sinceTimeMs)
        .reduce((total, entry) => total + entry.duration, 0);
    entries.forEach((entry) => performance.clearMeasures(entry.name));
    return durationMs;
};

/** Captures the named internal-measure breakdown for a phase that just finished. */
export const captureBreakdown = (
    specs: { label: string; nameSuffix: string }[],
    sinceTimeMs: number
): PhaseBreakdownEntry[] =>
    specs.map(({ label, nameSuffix }) => ({ label, durationMs: captureAndClearMeasure(nameSuffix, sinceTimeMs) }));
