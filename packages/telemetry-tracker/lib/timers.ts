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

    start(timer: TimerHandle, { restart = false }: { restart?: boolean } = {}) {
        if (restart || !this.startedAt.has(timer.key)) {
            this.startedAt.set(timer.key, performance.now());
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
