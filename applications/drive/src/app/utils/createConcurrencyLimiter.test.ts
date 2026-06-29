import { createConcurrencyLimiter } from './createConcurrencyLimiter';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

describe('createConcurrencyLimiter', () => {
    it('runs every queued task and returns their results in order', async () => {
        const limiter = createConcurrencyLimiter(2);

        const results = await Promise.all([
            limiter.run(async () => 'a'),
            limiter.run(async () => 'b'),
            limiter.run(async () => 'c'),
            limiter.run(async () => 'd'),
        ]);

        expect(results).toEqual(['a', 'b', 'c', 'd']);
    });

    it('never runs more than maxConcurrency tasks at once', async () => {
        const maxConcurrency = 3;
        const limiter = createConcurrencyLimiter(maxConcurrency);

        let current = 0;
        let peak = 0;

        const task = async () => {
            current++;
            peak = Math.max(peak, current);
            await delay(20);
            current--;
        };

        await Promise.all(Array.from({ length: 10 }, () => limiter.run(task)));

        expect(peak).toBeLessThanOrEqual(maxConcurrency);
        expect(peak).toBeGreaterThan(1);
    });

    it('releases the slot when a task throws, so later tasks still run', async () => {
        const limiter = createConcurrencyLimiter(1);

        await expect(
            limiter.run(async () => {
                throw new Error('boom');
            })
        ).rejects.toThrow('boom');

        // With maxConcurrency 1, this only resolves if the failed task released its slot.
        await expect(limiter.run(async () => 'ok')).resolves.toBe('ok');
    });

    it('propagates the task rejection to the caller', async () => {
        const limiter = createConcurrencyLimiter(2);

        await expect(limiter.run(async () => Promise.reject(new Error('nope')))).rejects.toThrow('nope');
    });
});
