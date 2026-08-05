import type { ToolStore } from '../toolModule';

/**
 * Resolve as soon as `read` returns a value, woken by the store that owns it rather than by a timer.
 * Resolves undefined on expiry (never rejects), so a stuck load degrades to "not ready yet".
 *
 * Every input to `read` must come from the store: a predicate that also reads React state through a ref
 * sees the pre-render value inside `dispatch`, so the notification that should have settled it evaluates
 * stale and the wait silently runs to its timeout.
 */
export const waitForStoreState = <T>(
    store: ToolStore,
    read: () => T | undefined,
    timeout: number
): Promise<T | undefined> =>
    new Promise((resolve) => {
        const existing = read();
        if (existing !== undefined) {
            resolve(existing);
            return;
        }

        let unsubscribe: () => void;
        let timer: ReturnType<typeof setTimeout>;
        const finish = (value?: T) => {
            unsubscribe();
            clearTimeout(timer);
            resolve(value);
        };
        unsubscribe = store.subscribe(() => {
            const value = read();
            if (value !== undefined) {
                finish(value);
            }
        });
        timer = setTimeout(() => finish(), timeout);
    });

/**
 * Stop waiting on a store/api call that never settles. The read's own budget is only checked between
 * steps, so an unbounded await inside one holds the whole tool open. Cannot cancel the work underneath —
 * it only stops this caller waiting on it.
 */
export const withTimeout = async (work: Promise<unknown>, timeout: number): Promise<void> => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        await Promise.race([
            work,
            new Promise<void>((resolve) => {
                timer = setTimeout(resolve, timeout);
            }),
        ]);
    } finally {
        clearTimeout(timer);
    }
};
