import { runScheduleIncrementalUpdate } from '.';

jest.mock('../../../../../../Logger', () => ({
    Logger: { info: jest.fn() },
}));

const DELAY_MS = 30_000;

describe('runScheduleIncrementalUpdate', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('resolves after the 30-second delay', async () => {
        const promise = runScheduleIncrementalUpdate(null, new AbortController().signal);
        jest.advanceTimersByTime(DELAY_MS);
        await expect(promise).resolves.toBeUndefined();
    });

    it('does not resolve before the full delay has elapsed', async () => {
        const promise = runScheduleIncrementalUpdate(null, new AbortController().signal);

        let resolved = false;
        void promise.then(() => {
            resolved = true;
        });

        jest.advanceTimersByTime(DELAY_MS - 1);
        await Promise.resolve(); // flush microtasks
        expect(resolved).toBe(false);
    });

    it('rejects with AbortError when the signal is aborted during the delay', async () => {
        const ac = new AbortController();
        const promise = runScheduleIncrementalUpdate(null, ac.signal);

        ac.abort();
        jest.runAllTimers();

        await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    });

    it('rejects immediately with AbortError when the signal is already aborted on entry', async () => {
        const ac = new AbortController();
        ac.abort();

        const promise = runScheduleIncrementalUpdate(null, ac.signal);
        jest.runAllTimers();

        await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
    });
});
