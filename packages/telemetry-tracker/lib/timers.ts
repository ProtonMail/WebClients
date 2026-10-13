declare const timerBrand: unique symbol;

/**
 * Typed handle of a funnel timer. Created once next to the events (`defineTimer`) and imported
 * where the timer is started, so the key is autocompleted by the editor and typos are impossible.
 */
export interface TimerHandle<K extends string = string> {
    readonly key: K;
    readonly [timerBrand]: true;
}

export const defineTimer = <const K extends string>(key: K): TimerHandle<K> => ({ key }) as TimerHandle<K>;

/** Keyed registry of running timers, based on a monotonic clock. */
export class Timers {
    private startedAt = new Map<string, number>();

    /** `elapsedMs` starts the timer as if it had begun that long ago (to resume a timer after a page reload) */
    start(timer: TimerHandle, { restart = false, elapsedMs = 0 }: { restart?: boolean; elapsedMs?: number } = {}) {
        if (restart || !this.startedAt.has(timer.key)) {
            this.startedAt.set(timer.key, performance.now() - Math.max(0, elapsedMs));
        }
    }

    /** Elapsed milliseconds (rounded), `undefined` if the timer is not running */
    elapsed(timer: TimerHandle) {
        const start = this.startedAt.get(timer.key);
        return start === undefined ? undefined : Math.max(0, Math.round(performance.now() - start));
    }

    cancel(timer: TimerHandle) {
        this.startedAt.delete(timer.key);
    }

    clear() {
        this.startedAt.clear();
    }
}
