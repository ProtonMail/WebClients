import { chainSort, sortOn } from './sort';

type SafeItem = { id: number; name: string; flag: boolean };
type UnsafeItem = Partial<{ id: number; name: string; flag: boolean }>;

const SAFE_ITEMS: SafeItem[] = [
    { id: 2, name: 'a', flag: true },
    { id: 1, name: 'c', flag: false },
    { id: 3, name: 'b', flag: true },
];

const UNSAFE_ITEMS: UnsafeItem[] = [
    { id: 2, name: 'a' },
    { id: 1, flag: true },
    { name: 'b', flag: false },
];

describe('sortOn', () => {
    describe('Defaults', () => {
        test('should sort descending', () => {
            expect([...SAFE_ITEMS].sort(sortOn('id'))).toEqual([
                { id: 3, name: 'b', flag: true },
                { id: 2, name: 'a', flag: true },
                { id: 1, name: 'c', flag: false },
            ]);
        });

        test('should support partial items', () => {
            expect([...UNSAFE_ITEMS].sort(sortOn('id'))).toEqual([
                { id: 2, name: 'a' },
                { id: 1, flag: true },
                { name: 'b', flag: false },
            ]);
        });
    });

    describe('Numbers', () => {
        test('should sort ascending', () => {
            expect([...SAFE_ITEMS].sort(sortOn('id', 'ASC'))).toEqual([
                { id: 1, name: 'c', flag: false },
                { id: 2, name: 'a', flag: true },
                { id: 3, name: 'b', flag: true },
            ]);
        });

        test('should sort descending', () => {
            expect([...SAFE_ITEMS].sort(sortOn('id', 'DESC'))).toEqual([
                { id: 3, name: 'b', flag: true },
                { id: 2, name: 'a', flag: true },
                { id: 1, name: 'c', flag: false },
            ]);
        });

        test('should sort ascending partial items', () => {
            expect([...UNSAFE_ITEMS].sort(sortOn('id', 'ASC'))).toEqual([
                { id: 1, flag: true },
                { id: 2, name: 'a' },
                { name: 'b', flag: false },
            ]);
        });

        test('should sort descending partial items', () => {
            expect([...UNSAFE_ITEMS].sort(sortOn('id', 'DESC'))).toEqual([
                { id: 2, name: 'a' },
                { id: 1, flag: true },
                { name: 'b', flag: false },
            ]);
        });
    });

    describe('Strings', () => {
        test('should sort ascending', () => {
            expect([...SAFE_ITEMS].sort(sortOn('name', 'ASC'))).toEqual([
                { id: 2, name: 'a', flag: true },
                { id: 3, name: 'b', flag: true },
                { id: 1, name: 'c', flag: false },
            ]);
        });

        test('should sort descending', () => {
            expect([...SAFE_ITEMS].sort(sortOn('name', 'DESC'))).toEqual([
                { id: 1, name: 'c', flag: false },
                { id: 3, name: 'b', flag: true },
                { id: 2, name: 'a', flag: true },
            ]);
        });

        test('should sort ascending partial items', () => {
            expect([...UNSAFE_ITEMS].sort(sortOn('name', 'ASC'))).toEqual([
                { id: 2, name: 'a' },
                { name: 'b', flag: false },
                { id: 1, flag: true },
            ]);
        });

        test('should sort descending partial items', () => {
            expect([...UNSAFE_ITEMS].sort(sortOn('name', 'DESC'))).toEqual([
                { name: 'b', flag: false },
                { id: 2, name: 'a' },
                { id: 1, flag: true },
            ]);
        });
    });

    describe('Booleans', () => {
        test('should sort ascending', () => {
            expect([...SAFE_ITEMS].sort(sortOn('flag', 'ASC'))).toEqual([
                { id: 1, name: 'c', flag: false },
                { id: 2, name: 'a', flag: true },
                { id: 3, name: 'b', flag: true },
            ]);
        });

        test('should sort descending', () => {
            expect([...SAFE_ITEMS].sort(sortOn('flag', 'DESC'))).toEqual([
                { id: 2, name: 'a', flag: true },
                { id: 3, name: 'b', flag: true },
                { id: 1, name: 'c', flag: false },
            ]);
        });

        test('should sort ascending partial items', () => {
            expect([...UNSAFE_ITEMS].sort(sortOn('flag', 'ASC'))).toEqual([
                { name: 'b', flag: false },
                { id: 1, flag: true },
                { id: 2, name: 'a' },
            ]);
        });

        test('should sort descending partial items', () => {
            expect([...UNSAFE_ITEMS].sort(sortOn('flag', 'DESC'))).toEqual([
                { id: 1, flag: true },
                { name: 'b', flag: false },
                { id: 2, name: 'a' },
            ]);
        });
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
