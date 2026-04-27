// Hands control back to the (SharedWorker) event loop so pending macrotasks —
// notably incoming `postMessage` events for search queries - get a turn. Use it
// inside long-running synchronous or microtask-only loops that would otherwise
// monopolize the worker thread.
//
// Picks the best primitive the host supports:
//   1. `scheduler.yield()` - explicit "yield to higher priority" API, no clamp.
//      Shipping in Chrome 129+; progressively enhances elsewhere.
//      https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield
//   2. `setTimeout(resolve, 0)` — universal fallback. Browsers clamp nested
//      calls to ~4ms. Good enough as a safety net.

type SchedulerLike = { yield?: () => Promise<void> };

function resolveYield(): () => Promise<void> {
    const scheduler = (globalThis as unknown as { scheduler?: SchedulerLike }).scheduler;
    // Must preserve the `this` binding to `scheduler`; a bare function reference
    // throws `Illegal invocation` when the host enforces WebIDL receiver checks.
    if (scheduler && typeof scheduler.yield === 'function') {
        return scheduler.yield.bind(scheduler);
    }
    return () =>
        new Promise<void>((resolve) => {
            setTimeout(resolve, 0);
        });
}

export const yieldToEventLoop: () => Promise<void> = resolveYield();
