import { generateTimeBuckets } from './timeBuckets';

describe('generateTimeBuckets', () => {
    it('yields a single bucket when min equals max', () => {
        expect([...generateTimeBuckets(100n, 100n, 10n)]).toEqual([{ low: 100n, high: 100n }]);
    });

    it('yields nothing when min is greater than max', () => {
        expect([...generateTimeBuckets(101n, 100n, 10n)]).toEqual([]);
    });

    it('yields a single bucket when the span is smaller than the window', () => {
        expect([...generateTimeBuckets(100n, 150n, 1000n)]).toEqual([{ low: 100n, high: 150n }]);
    });

    it('yields full buckets when the span is an exact multiple of the window', () => {
        expect([...generateTimeBuckets(1n, 30n, 10n)]).toEqual([
            { low: 21n, high: 30n },
            { low: 11n, high: 20n },
            { low: 1n, high: 10n },
        ]);
    });

    it('clamps the last bucket to min', () => {
        expect([...generateTimeBuckets(5n, 30n, 10n)]).toEqual([
            { low: 21n, high: 30n },
            { low: 11n, high: 20n },
            { low: 5n, high: 10n },
        ]);
    });

    it('covers every value in the range exactly once', () => {
        const min = 3n;
        const max = 47n;
        const counts = new Map<bigint, number>();
        for (const { low, high } of generateTimeBuckets(min, max, 7n)) {
            for (let value = low; value <= high; value++) {
                counts.set(value, (counts.get(value) ?? 0) + 1);
            }
        }

        expect(counts.size).toBe(Number(max - min + 1n));
        expect([...counts.values()].every((count) => count === 1)).toBe(true);
    });

    it('throws when the window is not positive', () => {
        expect(() => {
            return [...generateTimeBuckets(0n, 10n, 0n)];
        }).toThrow();
    });
});
