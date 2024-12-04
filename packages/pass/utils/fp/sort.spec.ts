import { chainSort, compare, sortOn } from './sort';

describe('compare', () => {
    test('should compare strings', () => {
        expect(compare('a', 'b')).toBeLessThan(0);
        expect(compare('b', 'a')).toBeGreaterThan(0);
        expect(compare('a', 'a')).toBe(0);
    });

    test('should compare numbers', () => {
        expect(compare(1, 2)).toBeLessThan(0);
        expect(compare(2, 1)).toBeGreaterThan(0);
        expect(compare(1, 1)).toBe(0);
    });

    test('should compare booleans', () => {
        expect(compare(false, true)).toBeLessThan(0);
        expect(compare(true, false)).toBeGreaterThan(0);
        expect(compare(true, true)).toBe(0);
    });

    test('should return 0 for incomparable types', () => {
        expect(compare(1, '1' as any)).toBe(0);
        expect(compare({}, [])).toBe(0);
        expect(compare(null, undefined)).toBe(0);
    });
});

describe('sortOn', () => {
    const items = [
        { id: 2, name: 'a' },
        { id: 1, name: 'c' },
        { id: 3, name: 'b' },
    ];

    test('should sort descending by default', () => {
        expect([...items].sort(sortOn('id'))).toEqual([
            { id: 3, name: 'b' },
            { id: 2, name: 'a' },
            { id: 1, name: 'c' },
        ]);
    });

    test('should sort on `id`', () => {
        expect([...items].sort(sortOn('id', 'ASC'))).toEqual([
            { id: 1, name: 'c' },
            { id: 2, name: 'a' },
            { id: 3, name: 'b' },
        ]);

        expect([...items].sort(sortOn('id', 'DESC'))).toEqual([
            { id: 3, name: 'b' },
            { id: 2, name: 'a' },
            { id: 1, name: 'c' },
        ]);
    });

    test('should sort on `name`', () => {
        expect([...items].sort(sortOn('name', 'ASC'))).toEqual([
            { id: 2, name: 'a' },
            { id: 3, name: 'b' },
            { id: 1, name: 'c' },
        ]);

        expect([...items].sort(sortOn('name', 'DESC'))).toEqual([
            { id: 1, name: 'c' },
            { id: 3, name: 'b' },
            { id: 2, name: 'a' },
        ]);
    });
});

describe('chainSort', () => {
    const items = [
        { priority: 1, date: '2024-01-01' },
        { priority: 1, date: '2024-01-02' },
        { priority: 2, date: '2024-01-01' },
    ];

    test('should respect multiple sort criterias', () => {
        expect([...items].sort(chainSort(sortOn('priority', 'DESC'), sortOn('date', 'ASC')))).toEqual([
            { priority: 2, date: '2024-01-01' },
            { priority: 1, date: '2024-01-01' },
            { priority: 1, date: '2024-01-02' },
        ]);

        expect([...items].sort(chainSort(sortOn('priority', 'ASC'), sortOn('date', 'DESC')))).toEqual([
            { priority: 1, date: '2024-01-02' },
            { priority: 1, date: '2024-01-01' },
            { priority: 2, date: '2024-01-01' },
        ]);
    });
});
