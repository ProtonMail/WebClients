import { replace, groupWith } from './array';

describe('array', () => {
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
