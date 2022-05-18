import { range, unique, uniqueBy, move, replace, groupWith } from './array';

describe('array', () => {
    describe('range', () => {
        it('should allow no parameters', () => {
            expect(range()).toEqual([0]);
        });

        it('should return empty array if end is before start', () => {
            expect(range(10, 2)).toEqual([]);
        });

        it('should return empty array if end is same as start', () => {
            expect(range(2, 2)).toEqual([]);
        });

        // Here closed is the mathematical definition
        it('should have a closed start', () => {
            const start = 0;
            const result = range(start, 2);
            expect(result[0]).toEqual(start);
        });

        // Here open is the mathematical definition
        it('should have an open end', () => {
            const end = 2;
            const result = range(0, end);
            expect(result[result.length - 1]).toBeLessThan(end);
        });

        it('should return range with correct step', () => {
            expect(range(-4, 5, 2)).toEqual([-4, -2, 0, 2, 4]);
            expect(range(0, 2, 0.5)).toEqual([0, 0.5, 1, 1.5]);
        });
    });

    describe('unique', () => {
        it('should return same', () => {
            expect(unique([1, 2])).toEqual([1, 2]);
        });

        it('should only return unique items', () => {
            expect(unique([1, 2, 1])).toEqual([1, 2]);
        });
    });

    describe('unique by', () => {
        it('should only get unique items', () => {
            const list = [{ foo: 'abc' }, { foo: 'bar' }, { foo: 'asd' }, { foo: 'bar' }, { foo: 'bar' }];
            expect(uniqueBy(list, ({ foo }) => foo)).toEqual([{ foo: 'abc' }, { foo: 'bar' }, { foo: 'asd' }]);
        });

        it('should only get unique items', () => {
            const list = [{ foo: 'abc' }, { foo: 'bar' }];
            expect(uniqueBy(list, ({ foo }) => foo)).toEqual([{ foo: 'abc' }, { foo: 'bar' }]);
        });
    });

    describe('move', () => {
        it('should return a new array', () => {
            const list = [1, 2, 3, 4, 5];
            expect(move(list, 0, 0) !== list).toBeTruthy();
        });

        it('should correctly move elements to new positions', () => {
            const list = [1, 2, 3, 4, 5];
            expect(move(list, 3, 0)).toEqual([4, 1, 2, 3, 5]);
        });

        it('should be able to handle negative indices', () => {
            const list = [1, 2, 3, 4, 5];
            expect(move(list, -1, 0)).toEqual([5, 1, 2, 3, 4]);
            expect(move(list, 1, -2)).toEqual([1, 3, 4, 2, 5]);
            expect(move(list, -3, -4)).toEqual([1, 3, 2, 4, 5]);
        });
    });

    describe('replace', () => {
        it('should return a new array', () => {
            const list = [1, 2, 3, 4, 5];
            expect(replace(list, 2, 7) !== list).toBeTruthy();
        });

        it('should correctly replace elements', () => {
            const list = [1, 2, 3, 4, 5];
            expect(replace(list, 2, 7)).toEqual([1, 7, 3, 4, 5]);
            expect(replace(list, 1, 2)).toEqual([2, 2, 3, 4, 5]);
            expect(replace(list, 5, 5)).toEqual([1, 2, 3, 4, 5]);
        });

        it('should return the same array if no replacement can be done', () => {
            const list = [1, 2, 3, 4, 5];
            expect(replace(list, 0, 0)).toEqual([1, 2, 3, 4, 5]);
        });
    });

    describe('group with', () => {
        it('should group', () => {
            expect(groupWith((a, b) => a === b, [1, 1, 1, 2, 2, 3])).toEqual([[1, 1, 1], [2, 2], [3]]);
        });

        it('should group empty', () => {
            expect(groupWith((x) => x, [])).toEqual([]);
        });

        it('should group nothing', () => {
            expect(groupWith(() => false, [1, 2, 3])).toEqual([]);
        });
    });
});
