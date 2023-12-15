import identity from '@proton/utils/identity';

import { asyncLock, awaiter, unwrap } from './promises';

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
        const asyncFn = jest.fn(() => new Promise<number>((resolve) => setTimeout(() => resolve(42), 1)));
        const asyncLockedFn = asyncLock(asyncFn);

        await Promise.all([asyncLockedFn(), asyncLockedFn(), asyncLockedFn()]);
        expect(asyncFn).toHaveBeenCalledTimes(1);
    });

    test('should lock concurrent calls by key', async () => {
        const asyncFn = jest.fn(() => new Promise<number>((resolve) => setTimeout(() => resolve(42), 1)));
        const asyncLockedFn = asyncLock(asyncFn, { key: () => `${Math.random()}` });

        await Promise.all([asyncLockedFn(), asyncLockedFn(), asyncLockedFn()]);
        expect(asyncFn).toHaveBeenCalledTimes(3);
    });

    test('should handle parametrized lock keys', async () => {
        const asyncFn = jest.fn((key: string) => new Promise<string>((resolve) => setTimeout(() => resolve(key), 1)));
        const asyncLockedFn = asyncLock(asyncFn, { key: identity });

        const res = await Promise.all([asyncLockedFn('foo'), asyncLockedFn('bar'), asyncLockedFn('foo')]);
        expect(asyncFn).toHaveBeenCalledTimes(2);
        expect(res).toEqual(['foo', 'bar', 'foo']);
    });
});
