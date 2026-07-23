import { createRollingWindowRateLimiter } from './createRollingWindowRateLimiter';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

describe('createRollingWindowRateLimiter', () => {
    it('grants requests immediately while under quota', async () => {
        const limiter = createRollingWindowRateLimiter(3, 1000);

        await expect(limiter.acquire()).resolves.toBeUndefined();
        await expect(limiter.acquire()).resolves.toBeUndefined();
        await expect(limiter.acquire()).resolves.toBeUndefined();
    });

    it('queues requests beyond quota until the window rolls forward', async () => {
        const limiter = createRollingWindowRateLimiter(2, 60);

        await limiter.acquire();
        await limiter.acquire();

        let thirdResolved = false;
        const third = limiter.acquire().then(() => {
            thirdResolved = true;
        });

        await delay(20);
        expect(thirdResolved).toBe(false);

        await third;
        expect(thirdResolved).toBe(true);
    });

    it('pause() blocks new grants even while under quota', async () => {
        const limiter = createRollingWindowRateLimiter(5, 1000);
        limiter.pause();

        let resolved = false;
        const acquired = limiter.acquire().then(() => {
            resolved = true;
        });

        await delay(20);
        expect(resolved).toBe(false);

        limiter.resume();
        await acquired;
        expect(resolved).toBe(true);
    });

    it('resume() drains queued waiters immediately, up to quota', async () => {
        const limiter = createRollingWindowRateLimiter(1, 1000);
        limiter.pause();

        let firstResolved = false;
        let secondResolved = false;
        const first = limiter.acquire().then(() => {
            firstResolved = true;
        });
        void limiter.acquire().then(() => {
            secondResolved = true;
        });

        limiter.resume();
        await first;
        expect(firstResolved).toBe(true);
        expect(secondResolved).toBe(false);

        await delay(20);
        expect(secondResolved).toBe(false);
    });

    it('getUsage() reports current consumption', async () => {
        const limiter = createRollingWindowRateLimiter(2, 1000);

        expect(limiter.getUsage()).toEqual({ used: 0, max: 2 });

        await limiter.acquire();
        await limiter.acquire();

        expect(limiter.getUsage()).toEqual({ used: 2, max: 2 });
    });
});
