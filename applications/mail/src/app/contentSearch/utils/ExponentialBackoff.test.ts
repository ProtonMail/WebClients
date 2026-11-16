import { ExponentialBackoff, type Timers } from './ExponentialBackoff';

/** timers that only fire when the test says so */
const makeFakeTimers = () => {
    const scheduled = new Map<number, { ms: number; callback: () => void }>();
    const cleared: unknown[] = [];
    let nextHandle = 1;
    const timers: Timers = {
        setTimeout: (callback, ms) => {
            const handle = nextHandle++;
            scheduled.set(handle, { ms, callback });
            return handle;
        },
        clearTimeout: (handle) => {
            cleared.push(handle);
            scheduled.delete(handle as number);
        },
    };
    const fireAll = () => {
        for (const { callback } of scheduled.values()) {
            callback();
        }
    };
    return { timers, scheduled, cleared, fireAll };
};

/** let every pending promise callback run */
const flush = async () => {
    await new Promise((resolve) => {
        setTimeout(resolve, 0);
    });
};

/** observe a promise without awaiting it, so a wait that never settles fails an assertion instead of hanging the test */
const track = (promise: Promise<void>) => {
    const state = { settled: false, rejected: false, error: undefined as unknown };
    promise.then(
        () => {
            state.settled = true;
        },
        (error) => {
            state.settled = true;
            state.rejected = true;
            state.error = error;
        }
    );
    return state;
};

describe('ExponentialBackoff', () => {
    const waitAndRecordDelay = async (backoff: ExponentialBackoff, fake: ReturnType<typeof makeFakeTimers>) => {
        const waiting = backoff.wait(new AbortController().signal);
        const [{ ms }] = fake.scheduled.values();
        fake.fireAll();
        await waiting;
        return ms;
    };

    it('doubles the delay of each wait up to the maximum', async () => {
        const fake = makeFakeTimers();
        const backoff = new ExponentialBackoff(10, 50, fake.timers);

        const delays = [];
        for (let i = 0; i < 5; i++) {
            delays.push(await waitAndRecordDelay(backoff, fake));
        }

        expect(delays).toEqual([10, 20, 40, 50, 50]);
    });

    it('starts over from the initial delay after a reset', async () => {
        const fake = makeFakeTimers();
        const backoff = new ExponentialBackoff(10, 50, fake.timers);
        await waitAndRecordDelay(backoff, fake);
        await waitAndRecordDelay(backoff, fake);

        backoff.reset();

        expect(await waitAndRecordDelay(backoff, fake)).toBe(10);
    });

    it('stays pending until the timer fires', async () => {
        const fake = makeFakeTimers();
        const backoff = new ExponentialBackoff(10, 50, fake.timers);

        const state = track(backoff.wait(new AbortController().signal));
        await flush();
        expect(state.settled).toBe(false);

        fake.fireAll();
        await flush();
        expect(state).toEqual({ settled: true, rejected: false, error: undefined });
    });

    it('rejects with the reason as soon as the signal aborts, and clears the timer', async () => {
        const fake = makeFakeTimers();
        const backoff = new ExponentialBackoff(1000, 1000, fake.timers);
        const controller = new AbortController();
        const reason = new Error('stopped');

        const state = track(backoff.wait(controller.signal));
        const [handle] = fake.scheduled.keys();
        controller.abort(reason);
        await flush();

        expect(state).toEqual({ settled: true, rejected: true, error: reason });
        expect(fake.cleared).toEqual([handle]);
    });

    it('rejects right away when the signal is already aborted', async () => {
        const fake = makeFakeTimers();
        const backoff = new ExponentialBackoff(1000, 1000, fake.timers);
        const controller = new AbortController();
        controller.abort('already');

        const state = track(backoff.wait(controller.signal));
        await flush();

        expect(state).toEqual({ settled: true, rejected: true, error: 'already' });
        expect(fake.scheduled.size).toBe(0);
    });
});
