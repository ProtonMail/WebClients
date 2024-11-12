import { dynMemo, maxAgeMemoize } from './memo';

const asyncFn = jest.fn((value: number) => Promise.resolve(value * Math.random()));

describe('`maxAgeMemoize`', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        asyncFn.mockClear();
    });

    afterEach(() => jest.clearAllTimers());

    test('should cache the result for the specified maximum age', async () => {
        const memoizedFunction = maxAgeMemoize(asyncFn);

        const result1 = await memoizedFunction(1, { maxAge: 10 }); /* 10 seconds */
        expect(asyncFn).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(5_000); /* advance timer below maxAge */
        const result2 = await memoizedFunction(1, { maxAge: 10 });
        expect(asyncFn).toHaveBeenCalledTimes(1);
        expect(result2).toBe(result1);

        jest.advanceTimersByTime(5_001); /* advance timer over maxAge */
        const result3 = await memoizedFunction(1, { maxAge: 10 });
        expect(result3).not.toBe(result1);
        expect(asyncFn).toHaveBeenCalledTimes(2);
    });

    test('should cache results separately for different arguments', async () => {
        const memoizedFunction = maxAgeMemoize(asyncFn);

        await memoizedFunction(1, { maxAge: 10 });
        expect(asyncFn).toHaveBeenCalledTimes(1);

        await memoizedFunction(2, { maxAge: 10 });
        expect(asyncFn).toHaveBeenCalledTimes(2);

        jest.advanceTimersByTime(5_000); /* advance timer below maxAge */
        await memoizedFunction(1, { maxAge: 10 });
        await memoizedFunction(2, { maxAge: 10 });
        expect(asyncFn).toHaveBeenCalledTimes(2);

        jest.advanceTimersByTime(5_001); /* advance timer over maxAge */
        await memoizedFunction(1, { maxAge: 10 });
        await memoizedFunction(2, { maxAge: 10 });
        expect(asyncFn).toHaveBeenCalledTimes(4);
    });

    test('should handle multiple calls with different maxAge options', async () => {
        const memoizedFunction = maxAgeMemoize(asyncFn);

        await memoizedFunction(1, { maxAge: 10 });
        expect(asyncFn).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(6_000); /* advance timer below maxAge */
        await memoizedFunction(1, { maxAge: 10 });
        expect(asyncFn).toHaveBeenCalledTimes(1);

        await memoizedFunction(1, { maxAge: 5 }); /* request new maxAge */
        expect(asyncFn).toHaveBeenCalledTimes(2);
    });

    test('should not cache a result who throwed error', async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const asyncFn = jest.fn((value: number) => Promise.resolve(value * Math.random()));
        const memoizedFunction = maxAgeMemoize(asyncFn);

        asyncFn.mockImplementationOnce(async () => {
            throw new Error('asyncFn error');
        });

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        expect(async () => {
            await memoizedFunction(1, { maxAge: 10 });
        }).rejects.toThrow('asyncFn error');
        expect(asyncFn).toHaveBeenCalledTimes(1);

        await memoizedFunction(1, { maxAge: 10 });
        expect(asyncFn).toHaveBeenCalledTimes(2);
        jest.advanceTimersByTime(6_000); /* advance timer below maxAge */
        await memoizedFunction(1, { maxAge: 10 });
        expect(asyncFn).toHaveBeenCalledTimes(2);
    });
});

describe('`dynMemo`', () => {
    const spy = jest.fn((str: string) => str.toUpperCase());
    const memoized = dynMemo(spy);

    beforeEach(() => {
        spy.mockClear();
        memoized.clear();
        memoized.memo = true;
    });

    test('should memoize when `memo=true`', () => {
        expect(memoized('test')).toBe('TEST'); // MISS
        expect(memoized('test')).toBe('TEST'); // HIT

        expect(spy).toHaveBeenCalledTimes(1);
    });

    test('should bypass cache when `memo=false`', () => {
        memoized.memo = false;
        expect(memoized('test')).toBe('TEST'); // MISS
        expect(memoized('test')).toBe('TEST'); // MISS

        expect(spy).toHaveBeenCalledTimes(2);
    });

    test('should clear cache when requested', () => {
        expect(memoized('test')).toBe('TEST'); // MISS
        memoized.clear(); // CACHE RESET
        expect(memoized('test')).toBe('TEST'); // MISS

        expect(spy).toHaveBeenCalledTimes(2);
    });

    test('should handle different inputs independently', () => {
        expect(memoized('test1')).toBe('TEST1'); // MISS
        expect(memoized('test2')).toBe('TEST2'); // MISS
        expect(memoized('test1')).toBe('TEST1'); // HIT

        expect(spy).toHaveBeenCalledTimes(2);
    });

    test('should respect memo flag changes', () => {
        expect(memoized('test')).toBe('TEST'); // MISS
        expect(memoized('test')).toBe('TEST'); // HIT

        memoized.memo = false; // CACHE RESET
        expect(memoized('test')).toBe('TEST'); // MISS
        expect(memoized('test')).toBe('TEST'); // MISS

        memoized.memo = true;
        expect(memoized('test')).toBe('TEST'); // MISS
        expect(memoized('test')).toBe('TEST'); // HIT

        expect(spy).toHaveBeenCalledTimes(4);
    });
});
