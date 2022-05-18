import { groupWith } from './array';

describe('array', () => {
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
