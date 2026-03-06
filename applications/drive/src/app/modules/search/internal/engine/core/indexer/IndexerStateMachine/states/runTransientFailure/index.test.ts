import { runTransientFailure } from '.';
import type { IndexerContext } from '../../types';

jest.mock('../../../../../../Logger', () => ({
    Logger: { info: jest.fn() },
}));

const BASE_DELAY_MS = 10_000;
const MAX_DELAY_MS = 600_000;

const LAST_ERROR = new Error('test error');

function makeCtx(transientFailureCount: number): IndexerContext {
    return {
        transientFailureCount,
        lastError: LAST_ERROR,
    } as unknown as IndexerContext;
}

describe('runTransientFailure', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('exponential back-off delay', () => {
        it.each([
            { attempt: 1, expectedDelay: BASE_DELAY_MS },
            { attempt: 2, expectedDelay: BASE_DELAY_MS * 2 },
            { attempt: 3, expectedDelay: BASE_DELAY_MS * 4 },
            { attempt: 4, expectedDelay: BASE_DELAY_MS * 8 },
        ])('waits ${expectedDelay}ms on attempt $attempt', async ({ attempt, expectedDelay }) => {
            const ctx = makeCtx(attempt);
            const promise = runTransientFailure(ctx, new AbortController().signal);
            jest.advanceTimersByTime(expectedDelay);
            await expect(promise).resolves.toBeUndefined();
        });

        it('does not resolve before the expected delay', async () => {
            const ctx = makeCtx(1);
            const promise = runTransientFailure(ctx, new AbortController().signal);

            let resolved = false;
            void promise.then(() => {
                resolved = true;
            });

            jest.advanceTimersByTime(BASE_DELAY_MS - 1);
            await Promise.resolve(); // flush microtasks
            expect(resolved).toBe(false);
        });

        it('caps the delay at MAX_DELAY_MS for very high attempt counts', async () => {
            const ctx = makeCtx(100); // BASE * 2^99 far exceeds the cap
            const promise = runTransientFailure(ctx, new AbortController().signal);
            jest.advanceTimersByTime(MAX_DELAY_MS);
            await expect(promise).resolves.toBeUndefined();
        });

        it('does not resolve before MAX_DELAY_MS even for very high attempt counts', async () => {
            const ctx = makeCtx(100);
            const promise = runTransientFailure(ctx, new AbortController().signal);

            let resolved = false;
            void promise.then(() => {
                resolved = true;
            });

            jest.advanceTimersByTime(MAX_DELAY_MS - 1);
            await Promise.resolve();
            expect(resolved).toBe(false);
        });
    });

    describe('abort', () => {
        it('rejects with AbortError when the signal is aborted during the delay', async () => {
            const ac = new AbortController();
            const ctx = makeCtx(1);
            const promise = runTransientFailure(ctx, ac.signal);

            ac.abort();
            jest.runAllTimers();

            await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
        });

        it('rejects immediately with AbortError when the signal is already aborted on entry', async () => {
            const ac = new AbortController();
            ac.abort();
            const ctx = makeCtx(1);
            const promise = runTransientFailure(ctx, ac.signal);
            jest.runAllTimers();

            await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
        });

        it('preserves ctx.lastError when aborted (recovery did not complete)', async () => {
            const ac = new AbortController();
            const ctx = makeCtx(2);
            const promise = runTransientFailure(ctx, ac.signal);
            ac.abort();
            jest.runAllTimers();

            await expect(promise).rejects.toThrow();
            expect(ctx.lastError).toBe(LAST_ERROR);
        });

        it('does not reset ctx.transientFailureCount when aborted', async () => {
            const ac = new AbortController();
            const ctx = makeCtx(2);
            const promise = runTransientFailure(ctx, ac.signal);
            ac.abort();
            jest.runAllTimers();

            await expect(promise).rejects.toThrow();
            expect(ctx.transientFailureCount).toBe(2);
        });
    });
});
