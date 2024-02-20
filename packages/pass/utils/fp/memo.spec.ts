import { maxAgeMemoize } from './memo';

const asyncFn = jest.fn((value: number) => Promise.resolve(value * Math.random()));

describe('maxAgeMemoize', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        asyncFn.mockClear();
    });

    afterEach(() => jest.clearAllTimers());

    it('should cache the result for the specified maximum age', async () => {
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

    it('should cache results separately for different arguments', async () => {
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

    it('should handle multiple calls with different maxAge options', async () => {
        const memoizedFunction = maxAgeMemoize(asyncFn);

        await memoizedFunction(1, { maxAge: 10 });
        expect(asyncFn).toHaveBeenCalledTimes(1);

        jest.advanceTimersByTime(6_000); /* advance timer below maxAge */
        await memoizedFunction(1, { maxAge: 10 });
        expect(asyncFn).toHaveBeenCalledTimes(1);

        await memoizedFunction(1, { maxAge: 5 }); /* request new maxAge */
        expect(asyncFn).toHaveBeenCalledTimes(2);
    });
});
