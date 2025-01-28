import type { MaybeNull } from '@proton/pass/types';

import { groupByKey } from './group-by-key';

type TestItem = { id: number; name: string; age?: MaybeNull<number> };

describe('groupByKey function', () => {
    const data: TestItem[] = [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 42 },
        { id: 3, name: 'Alice', age: 42 },
    ];

    it('should handle an empty input array', () => {
        const result = groupByKey([], 'name');
        expect(result).toEqual([]);
    });

    it('should group objects by a specified key [string]', () => {
        const result = groupByKey(data, 'name');
        expect(result).toEqual([
            [
                { id: 1, name: 'Alice', age: 30 },
                { id: 3, name: 'Alice', age: 42 },
            ],
            [{ id: 2, name: 'Bob', age: 42 }],
        ]);
    });

    it('should group objects by a specified key [number]', () => {
        const result = groupByKey(data, 'age');
        expect(result).toEqual([
            [{ id: 1, name: 'Alice', age: 30 }],
            [
                { id: 2, name: 'Bob', age: 42 },
                { id: 3, name: 'Alice', age: 42 },
            ],
        ]);
    });

    it('should group objects by a specified key [function]', () => {
        const result = groupByKey(data, (item) => item.name);
        expect(result).toEqual([
            [
                { id: 1, name: 'Alice', age: 30 },
                { id: 3, name: 'Alice', age: 42 },
            ],
            [{ id: 2, name: 'Bob', age: 42 }],
        ]);

        const data2: TestItem[] = [
            { id: 1, name: 'Alice', age: 30 },
            { id: 2, name: 'Bob', age: 42 },
            { id: 3, name: 'Alice', age: 42 },
            { id: 4, name: '', age: 41 },
            { id: 5, name: '', age: 42 },
        ];

        const result2 = groupByKey(data2, (item) => item.name);
        expect(result2).toEqual([
            [
                { id: 1, name: 'Alice', age: 30 },
                { id: 3, name: 'Alice', age: 42 },
            ],
            [{ id: 2, name: 'Bob', age: 42 }],
            [
                { id: 4, name: '', age: 41 },
                { id: 5, name: '', age: 42 },
            ],
        ]);
    });

    it('should handle objects with missing keys if options.splitEmpty = true', () => {
        const dataWithMissingKey: TestItem[] = [...data, { id: 4, name: 'Robert' }, { id: 5, name: 'Alex' }];
        const result = groupByKey(dataWithMissingKey, 'age', { splitEmpty: true });
        expect(result).toEqual([
            [{ id: 1, name: 'Alice', age: 30 }],
            [
                { id: 2, name: 'Bob', age: 42 },
                { id: 3, name: 'Alice', age: 42 },
            ],
            [{ id: 4, name: 'Robert' }],
            [{ id: 5, name: 'Alex' }],
        ]);
    });

    it('should handle objects with missing keys and group them if options.splitEmpty = false', () => {
        const dataWithMissingKey: TestItem[] = [
            ...data,
            { id: 4, name: 'Robert', age: undefined },
            { id: 5, name: 'Alex', age: null },
        ];
        const result = groupByKey(dataWithMissingKey, 'age', { splitEmpty: false });
        expect(result).toEqual([
            [{ id: 1, name: 'Alice', age: 30 }],
            [
                { id: 2, name: 'Bob', age: 42 },
                { id: 3, name: 'Alice', age: 42 },
            ],
            [
                { id: 4, name: 'Robert', age: undefined },
                { id: 5, name: 'Alex', age: null },
            ],
        ]);
    });
});
