import { asyncLatest, asyncLock, asyncQueue, awaiter, cancelable, pool, unwrap } from './promises';

type TestResolvers = { resolve: (val: number) => void; reject: (err: unknown) => void }[];

const resolvers: TestResolvers = [];
const error = new Error('invalid');

const asyncFn = jest.fn<Promise<number>, [key?: string]>(() => {
    return new Promise<number>((resolve, reject) => {
        resolvers.push({ resolve, reject });
    });
});

describe('promise', () => {
    beforeEach(() => {
        resolvers.length = 0;
        asyncFn.mockClear();
    });

    describe('unwrap', () => {
        test('unwraps promises in a flat array', async () => {
            const result = await unwrap([1, 2, Promise.resolve(3)]);
            expect(result).toEqual([1, 2, 3]);
        });

        test('unwraps promises in a nested array', async () => {
            const result = await unwrap([1, 2, [Promise.resolve(3)]]);
            expect(result).toEqual([1, 2, [3]]);
        });

        test('unwraps promises in a deeply nested array', async () => {
            const result = await unwrap([[Promise.resolve(1)], [[Promise.resolve(2)]]]);
            expect(result).toEqual([[1], [[2]]]);
        });

        test('handles empty array', async () => {
            const result = await unwrap([]);
            expect(result).toEqual([]);
        });
    });

    describe('awaiter', () => {
        test('creates an awaiter with resolve function', async () => {
            const awaited = awaiter<number>();
            awaited.resolve(42);
            const result = await awaited;
            expect(result).toBe(42);
        });
    });

    describe('asyncLock', () => {
        test('should lock all concurrent calls if no key specified', async () => {
            const asyncLockedFn = asyncLock(asyncFn);

            const job0 = asyncLockedFn();
            const job1 = asyncLockedFn();
            const job2 = asyncLockedFn();

            await Promise.resolve();
            resolvers[0].resolve(0);

            const job = Promise.all([job0, job1, job2]);
            expect(asyncFn).toHaveBeenCalledTimes(1);
            await expect(job).resolves.toEqual([0, 0, 0]);
        });

        test('should lock concurrent calls by key', async () => {
            const asyncLockedFn = asyncLock(asyncFn, { key: () => `${Math.random()}` });

            const job0 = asyncLockedFn();
            const job1 = asyncLockedFn();
            const job2 = asyncLockedFn();

            await Promise.resolve();
            resolvers[0].resolve(0);
            resolvers[1].resolve(1);
            resolvers[2].resolve(2);

            const job = Promise.all([job0, job1, job2]);
            expect(asyncFn).toHaveBeenCalledTimes(3);
            await expect(job).resolves.toEqual([0, 1, 2]);
        });

        test('should handle parametrized lock keys', async () => {
            const asyncLockedFn = asyncLock(asyncFn, { key: (k) => k! });

            const job0 = asyncLockedFn('keyA');
            const job1 = asyncLockedFn('keyB');
            const job2 = asyncLockedFn('keyA');

            await Promise.resolve();
            resolvers[0].resolve(0);
            resolvers[1].resolve(1);

            const job = Promise.all([job0, job1, job2]);
            expect(asyncFn).toHaveBeenCalledTimes(2);
            await expect(job).resolves.toEqual([0, 1, 0]);
        });
    });

    describe('asyncQueue', () => {
        test('should process async calls in a queue in the correct order', async () => {
            const asyncQueueFn = asyncQueue(asyncFn);

            const job0 = asyncQueueFn();
            const job1 = asyncQueueFn();
            const job2 = asyncQueueFn();

            expect(asyncFn).not.toHaveBeenCalled();
            await Promise.resolve();

            expect(asyncFn).toHaveBeenCalledTimes(1);
            resolvers[0].resolve(0);
            await expect(job0).resolves.toEqual(0);

            expect(asyncFn).toHaveBeenCalledTimes(2);
            resolvers[1].resolve(1);
            await expect(job1).resolves.toEqual(1);

            expect(asyncFn).toHaveBeenCalledTimes(3);
            resolvers[2].resolve(2);
            await expect(job2).resolves.toEqual(2);
        });

        test('should handle parametrized queue keys', async () => {
            const asyncQueueFn = asyncQueue(asyncFn, { key: (k) => k! });

            const job0 = asyncQueueFn('keyA');
            const job1 = asyncQueueFn('keyB');
            const job2 = asyncQueueFn('keyA');

            expect(asyncFn).not.toHaveBeenCalled();
            await Promise.resolve();

            /* check both initial jobs have been called */
            expect(asyncFn).toHaveBeenCalledTimes(2);
            resolvers[0].resolve(0);
            resolvers[1].resolve(1);
            await expect(job0).resolves.toEqual(0);
            await expect(job1).resolves.toEqual(1);

            expect(asyncFn).toHaveBeenCalledTimes(3);
            resolvers[2].resolve(2);
            await expect(job2).resolves.toEqual(2);
        });

        test('should continue queue if async function throws', async () => {
            const asyncQueueFn = asyncQueue(asyncFn);

            const job0 = asyncQueueFn();
            const job1 = asyncQueueFn();
            const job2 = asyncQueueFn();

            expect(asyncFn).not.toHaveBeenCalled();
            await Promise.resolve();

            expect(asyncFn).toHaveBeenCalledTimes(1);
            resolvers[0].resolve(0);
            await expect(job0).resolves.toEqual(0);

            expect(asyncFn).toHaveBeenCalledTimes(2);
            resolvers[1].reject(error);
            await expect(job1).rejects.toEqual(error);

            expect(asyncFn).toHaveBeenCalledTimes(3);
            resolvers[2].resolve(2);
            await expect(job2).resolves.toEqual(2);
        });
    });

    describe('asyncLatest', () => {
        type LatestResolver = { resolve: () => void; signal: AbortSignal };
        const resolvers: LatestResolver[] = [];
        const effects: number[] = [];

        const fn = jest.fn<Promise<void>, [AbortSignal, number]>(
            (signal, value) =>
                new Promise<void>((resolve) =>
                    resolvers.push({
                        resolve: () => {
                            if (!signal.aborted) effects.push(value);
                            resolve();
                        },
                        signal,
                    })
                )
        );

        beforeEach(() => {
            resolvers.length = 0;
            effects.length = 0;
            fn.mockClear();
        });

        test('run executes the function and commits its effect', async () => {
            const runner = asyncLatest(fn);
            const job = runner.run(42);
            resolvers[0].resolve();
            await job;

            expect(effects).toEqual([42]);
        });

        test('calling run again aborts the previous signal and only the latest effect commits', async () => {
            const runner = asyncLatest(fn);
            const job0 = runner.run(0);
            const job1 = runner.run(1);

            expect(resolvers[0].signal.aborted).toBe(true);
            expect(resolvers[1].signal.aborted).toBe(false);

            resolvers[0].resolve();
            resolvers[1].resolve();
            await Promise.all([job0, job1]);

            expect(effects).toEqual([1]);
        });

        test('successive runs abort all prior signals', async () => {
            const runner = asyncLatest(fn);
            void runner.run(0);
            void runner.run(1);
            void runner.run(2);

            expect(resolvers[0].signal.aborted).toBe(true);
            expect(resolvers[1].signal.aborted).toBe(true);
            expect(resolvers[2].signal.aborted).toBe(false);
        });

        test('cancel aborts the in-flight signal and suppresses the effect', async () => {
            const runner = asyncLatest(fn);
            const job = runner.run(0);
            runner.cancel();
            resolvers[0].resolve();
            await job;

            expect(effects).toEqual([]);
        });

        test('run after cancel starts fresh and commits its effect', async () => {
            const runner = asyncLatest(fn);
            void runner.run(0);
            runner.cancel();
            const job = runner.run(1);
            resolvers[1].resolve();
            await job;

            expect(effects).toEqual([1]);
        });
    });

    describe('pool', () => {
        type PoolResolver = { resolve: (val: string) => void; reject: (err: unknown) => void };
        const poolResolvers: PoolResolver[] = [];

        const poolJob = jest.fn(
            (_item: number, _index: number) =>
                new Promise<string>((resolve, reject) => poolResolvers.push({ resolve, reject }))
        );

        beforeEach(() => {
            poolResolvers.length = 0;
            poolJob.mockClear();
        });

        test('runs at most `concurrency` jobs at once and preserves item order', async () => {
            const result = pool([0, 1, 2, 3, 4], 2, poolJob);
            expect(poolJob).toHaveBeenCalledTimes(2);

            poolResolvers[0].resolve('a');
            await Promise.resolve();
            expect(poolJob).toHaveBeenCalledTimes(3);

            poolResolvers[1].resolve('b');
            await Promise.resolve();
            expect(poolJob).toHaveBeenCalledTimes(4);

            poolResolvers[2].resolve('c');
            await Promise.resolve();
            expect(poolJob).toHaveBeenCalledTimes(5);

            poolResolvers[3].resolve('d');
            poolResolvers[4].resolve('e');

            await expect(result).resolves.toEqual(['a', 'b', 'c', 'd', 'e']);
        });

        test('preserves result order even when jobs complete out of order', async () => {
            const result = pool([0, 1, 2], 3, poolJob);
            expect(poolJob).toHaveBeenCalledTimes(3);

            poolResolvers[1].resolve('b');
            poolResolvers[2].resolve('c');
            poolResolvers[0].resolve('a');

            await expect(result).resolves.toEqual(['a', 'b', 'c']);
        });

        test('reports progress as each item completes', async () => {
            const onProgress = jest.fn();
            const result = pool([0, 1, 2], 2, poolJob, onProgress);

            poolResolvers[0].resolve('a');
            await Promise.resolve();
            expect(onProgress).toHaveBeenCalledWith(1, 3);

            poolResolvers[1].resolve('b');
            await Promise.resolve();
            expect(onProgress).toHaveBeenCalledWith(2, 3);

            poolResolvers[2].resolve('c');
            await expect(result).resolves.toEqual(['a', 'b', 'c']);
            expect(onProgress).toHaveBeenLastCalledWith(3, 3);
        });

        test('stops dispatching new work after a failure, but lets in-flight jobs finish', async () => {
            const result = pool([0, 1, 2, 3], 2, poolJob);
            expect(poolJob).toHaveBeenCalledTimes(2);

            const error = new Error('fail');
            poolResolvers[0].reject(error);
            await expect(result).rejects.toBe(error);

            /* worker still processing item 1 finishes normally, but must not pick up item 2 */
            poolResolvers[1].resolve('b');
            await Promise.resolve();
            expect(poolJob).toHaveBeenCalledTimes(2);
        });

        test('resolves immediately for an empty array without calling job', async () => {
            await expect(pool([], 4, poolJob)).resolves.toEqual([]);
            expect(poolJob).not.toHaveBeenCalled();
        });

        test('clamps concurrency to at least 1 and at most the item count', async () => {
            const zeroConcurrency = pool([0, 1], 0, poolJob);
            expect(poolJob).toHaveBeenCalledTimes(1);
            poolResolvers[0].resolve('a');
            await Promise.resolve();
            poolResolvers[1].resolve('b');
            await expect(zeroConcurrency).resolves.toEqual(['a', 'b']);

            poolJob.mockClear();
            poolResolvers.length = 0;

            const oversizedConcurrency = pool([0, 1], 10, poolJob);
            expect(poolJob).toHaveBeenCalledTimes(2);
            poolResolvers[0].resolve('a');
            poolResolvers[1].resolve('b');
            await expect(oversizedConcurrency).resolves.toEqual(['a', 'b']);
        });

        test('falls back to a concurrency of 1 for a non-finite value', async () => {
            const result = pool([0, 1], NaN, poolJob);
            expect(poolJob).toHaveBeenCalledTimes(1);

            poolResolvers[0].resolve('a');
            await Promise.resolve();
            expect(poolJob).toHaveBeenCalledTimes(2);

            poolResolvers[1].resolve('b');
            await expect(result).resolves.toEqual(['a', 'b']);
        });
    });

    describe('cancelable', () => {
        test('should resolve when job completes without cancellation', async () => {
            const job = jest.fn(() => Promise.resolve(42));
            const cancelableJob = cancelable(job);
            const result = cancelableJob.run();

            await expect(result).resolves.toBe(42);
            expect(job).toHaveBeenCalledTimes(1);
        });

        test('should reject when canceled before job completes', async () => {
            jest.useFakeTimers();
            const job = jest.fn(() => new Promise((resolve) => setTimeout(() => resolve(42), 100)));
            const cancelableJob = cancelable(job);

            const result = cancelableJob.run();
            cancelableJob.cancel();
            jest.runAllTimers();

            await expect(result).rejects.toBeUndefined();
            expect(job).toHaveBeenCalledTimes(1);
        });

        test('should reject on next call if canceled after job completes', async () => {
            const job = jest.fn(() => Promise.resolve(42));
            const cancelableJob = cancelable(job);
            const result = cancelableJob.run();

            await expect(result).resolves.toBe(42);
            expect(job).toHaveBeenCalledTimes(1);
            cancelableJob.cancel();

            await expect(cancelableJob.run).rejects.toBeUndefined();
        });
    });
});
