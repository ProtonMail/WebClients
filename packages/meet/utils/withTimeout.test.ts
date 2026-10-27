import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TimeoutError, withIdleTimeout } from './withTimeout';

const IDLE_TIMEOUT_MS = 15_000;

describe('withIdleTimeout', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance'] });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('resolves with the value when the promise settles before going idle', async () => {
        const startedAt = performance.now();
        const promise = new Promise<string>((resolve) => setTimeout(() => resolve('done'), 5_000));

        const result = withIdleTimeout(promise, 'Stop recording', IDLE_TIMEOUT_MS, () => startedAt);
        await vi.advanceTimersByTimeAsync(5_000);

        await expect(result).resolves.toBe('done');
    });

    it('rejects with a TimeoutError when there is no activity for the idle window', async () => {
        const startedAt = performance.now();
        const neverSettles = new Promise<string>(() => {});

        const result = withIdleTimeout(neverSettles, 'Stop recording', IDLE_TIMEOUT_MS, () => startedAt);
        const assertion = expect(result).rejects.toBeInstanceOf(TimeoutError);
        await vi.advanceTimersByTimeAsync(IDLE_TIMEOUT_MS);

        await assertion;
    });

    it('keeps waiting past the idle window while activity keeps advancing', async () => {
        let lastActivityAt = performance.now();
        const reportActivity = setInterval(() => {
            lastActivityAt = performance.now();
        }, 10_000);
        const promise = new Promise<string>((resolve) => setTimeout(() => resolve('flushed'), 60_000));

        const result = withIdleTimeout(promise, 'Stop recording', IDLE_TIMEOUT_MS, () => lastActivityAt);
        await vi.advanceTimersByTimeAsync(60_000);
        clearInterval(reportActivity);

        await expect(result).resolves.toBe('flushed');
    });
});
