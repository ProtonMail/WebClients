import { listIds, listify, mapIds, mapKeys, mapLength, mapify, setify } from './collections';

describe('collections', () => {
    // Test data
    const testItems = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' },
    ];

    const testMap = {
        '1': { id: '1', name: 'Item 1' },
        '2': { id: '2', name: 'Item 2' },
        '3': { id: '3', name: 'Item 3' },
    };

    describe('mapify', () => {
        it('should convert an array of items to a map by id', () => {
            expect(mapify(testItems)).toEqual(testMap);
        });

        it('should handle empty array', () => {
            expect(mapify([])).toEqual({});
        });
    });

    describe('listify', () => {
        it('should convert a map to an array of items', () => {
            expect(listify(testMap)).toEqual(expect.arrayContaining(testItems));
        });

        it('should handle empty map', () => {
            expect(listify({})).toEqual([]);
        });
    });

    describe('mapKeys', () => {
        it('should return all keys from a map', () => {
            expect(mapKeys(testMap)).toEqual(['1', '2', '3']);
        });

        it('should handle empty map', () => {
            expect(mapKeys({})).toEqual([]);
        });
    });

    describe('mapLength', () => {
        it('should return the number of entries in a map', () => {
            expect(mapLength(testMap)).toBe(3);
        });

        it('should handle empty map', () => {
            expect(mapLength({})).toBe(0);
        });
    });

    describe('mapIds', () => {
        it('should return all ids from a map of items', () => {
            expect(mapIds(testMap)).toEqual(['1', '2', '3']);
        });

        it('should handle empty map', () => {
            expect(mapIds({})).toEqual([]);
        });
    });

    describe('listIds', () => {
        it('should return all ids from an array of items', () => {
            expect(listIds(testItems)).toEqual(['1', '2', '3']);
        });

        it('should handle empty array', () => {
            expect(listIds([])).toEqual([]);
        });
    });

    describe('setify', () => {
        it('should convert an array to a Set', () => {
            const array = [1, 2, 3, 3, 2, 1];
            const result = setify(array);
            expect(result).toBeInstanceOf(Set);
            expect([...result]).toEqual([1, 2, 3]);
        });

        it('should convert a record to a Set of values', () => {
            const record = { a: 1, b: 2, c: 2, d: 3 };
            const result = setify(record);
            expect(result).toBeInstanceOf(Set);
            expect([...result]).toEqual(expect.arrayContaining([1, 2, 3]));
        });

        it('should handle empty array', () => {
            const result = setify([]);
            expect(result).toBeInstanceOf(Set);
            expect(result.size).toBe(0);
        });

        it('should handle empty record', () => {
            const result = setify({});
            expect(result).toBeInstanceOf(Set);
            expect(result.size).toBe(0);
        });

        it('should remove duplicates', () => {
            const array = [1, 1, 2, 2, 3, 3];
            const result = setify(array);
            expect(result.size).toBe(3);
            expect([...result]).toEqual([1, 2, 3]);
        });
    });
});
