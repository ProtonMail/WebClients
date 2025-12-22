import { createWeakRefCache, dynMemo, maxAgeMemoize } from './memo';

const asyncFn = jest.fn((value: number) => Promise.resolve(value * Math.random()));

describe('`maxAgeMemoize`', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        asyncFn.mockClear();
    });

    afterEach(() => jest.clearAllTimers());

    test('should cache the result for the specified maximum age', async () => {
        const memoizedFunction = maxAgeMemoize(asyncFn, { maxAge: 10_000 });

        const result1 = await memoizedFunction(1);
        expect(asyncFn).toHaveBeenCalledTimes(1);

        /* advance timer below maxAge */
        jest.advanceTimersByTime(5_000);

        const result2 = await memoizedFunction(1);
        expect(asyncFn).toHaveBeenCalledTimes(1);
        expect(result2).toBe(result1);

        /* advance timer over maxAge */
        jest.advanceTimersByTime(5_001);

        const result3 = await memoizedFunction(1);
        expect(result3).not.toBe(result1);
        expect(asyncFn).toHaveBeenCalledTimes(2);
    });

    test('should cache results separately for different arguments', async () => {
        const memoizedFunction = maxAgeMemoize(asyncFn, { maxAge: 10_000 });

        await memoizedFunction(1);
        await memoizedFunction(2);
        expect(asyncFn).toHaveBeenCalledTimes(2);

        /* advance timer below maxAge */
        jest.advanceTimersByTime(5_000);

        await memoizedFunction(1);
        await memoizedFunction(2);
        expect(asyncFn).toHaveBeenCalledTimes(2);

        /* advance timer over maxAge */
        jest.advanceTimersByTime(5_001);

        await memoizedFunction(1);
        await memoizedFunction(2);
        expect(asyncFn).toHaveBeenCalledTimes(4);
    });

    test('should handle by-passing `maxAge` via `flush`', async () => {
        const memoizedFunction = maxAgeMemoize(asyncFn, { maxAge: 10_000 });

        await memoizedFunction(1);
        expect(asyncFn).toHaveBeenCalledTimes(1);

        /* advance timer below maxAge */
        jest.advanceTimersByTime(6_000);

        await memoizedFunction(1);
        expect(asyncFn).toHaveBeenCalledTimes(1);

        /* flush */
        await memoizedFunction.flush(1);
        expect(asyncFn).toHaveBeenCalledTimes(2);
    });

    test('should not cache a result who throwed error', async () => {
        const asyncFn = jest.fn((value: number) => Promise.resolve(value * Math.random()));
        const memoizedFunction = maxAgeMemoize(asyncFn, { maxAge: 10_000 });

        asyncFn.mockImplementationOnce(async () => {
            throw new Error('asyncFn error');
        });

        await expect(() => memoizedFunction(1)).rejects.toThrow('asyncFn error');
        expect(asyncFn).toHaveBeenCalledTimes(1);

        await memoizedFunction(1);
        expect(asyncFn).toHaveBeenCalledTimes(2);

        /* advance timer below maxAge */
        jest.advanceTimersByTime(6_000);

        await memoizedFunction(1);
        expect(asyncFn).toHaveBeenCalledTimes(2);
    });

    test('should handle `createWeakRefCache` factory', async () => {
        const elementFn = jest.fn(async (element: HTMLElement, data: string) => `${element.tagName}-${data}`);

        const memoizedFunction = maxAgeMemoize(elementFn, {
            maxAge: 10_000,
            cache: createWeakRefCache((element) => element),
        });

        const element1 = document.createElement('div');
        const element2 = document.createElement('span');
        const element3 = document.createElement('div');

        const result1 = await memoizedFunction(element1, 'test');
        const result2 = await memoizedFunction(element2, 'test');

        expect(elementFn).toHaveBeenCalledTimes(2);
        expect(result1).toBe('DIV-test');
        expect(result2).toBe('SPAN-test');

        jest.advanceTimersByTime(5_000);

        expect(await memoizedFunction(element1, 'test')).toEqual(result1);
        expect(await memoizedFunction(element2, 'test')).toEqual(result2);
        expect(elementFn).toHaveBeenCalledTimes(2);

        await memoizedFunction(element3, 'test');
        expect(elementFn).toHaveBeenCalledTimes(3);
    });

    test('should clear all cached results via `clear`', async () => {
        const memoizedFunction = maxAgeMemoize(asyncFn, { maxAge: 10_000 });

        const result1 = await memoizedFunction(1);
        const result2 = await memoizedFunction(2);
        expect(asyncFn).toHaveBeenCalledTimes(2);

        jest.advanceTimersByTime(5_000);

        await memoizedFunction(1);
        await memoizedFunction(2);
        expect(asyncFn).toHaveBeenCalledTimes(2);

        memoizedFunction.clear();

        const result3 = await memoizedFunction(1);
        const result4 = await memoizedFunction(2);
        expect(result3).not.toBe(result1);
        expect(result4).not.toBe(result2);
        expect(asyncFn).toHaveBeenCalledTimes(4);
    });

    test('should clear cache with `createWeakRefCache` via `clear`', async () => {
        const elementFn = jest.fn(async (element: HTMLElement, data: string) => `${element.tagName}-${data}`);
        const memoizedFunction = maxAgeMemoize(elementFn, {
            maxAge: 10_000,
            cache: createWeakRefCache((element) => element),
        });

        const element1 = document.createElement('div');
        const element2 = document.createElement('span');

        const result1 = await memoizedFunction(element1, 'test');
        const result2 = await memoizedFunction(element2, 'test');
        expect(elementFn).toHaveBeenCalledTimes(2);

        jest.advanceTimersByTime(5_000);

        expect(await memoizedFunction(element1, 'test')).toEqual(result1);
        expect(await memoizedFunction(element2, 'test')).toEqual(result2);
        expect(elementFn).toHaveBeenCalledTimes(2);

        memoizedFunction.clear();

        await memoizedFunction(element1, 'test');
        await memoizedFunction(element2, 'test');
        expect(elementFn).toHaveBeenCalledTimes(4);
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
