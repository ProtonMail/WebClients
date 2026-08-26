import groupWith from './groupWith';

describe('groupWith', () => {
    it('groups items of an array into a two dimensional array based on a condition of whether or not two items should be grouped', () => {
        expect(groupWith((a, b) => a === b, [1, 1, 1, 2, 2, 3])).toEqual([[1, 1, 1], [2, 2], [3]]);
    });

    it('defaults to use an empty array', () => {
        expect(groupWith((a, b) => a === b)).toEqual([]);
    });

    it('returns an empty array if no items are provided in the to-be-grouped array', () => {
        expect(groupWith((x) => x, [])).toEqual([]);
    });

    it('returns an empty array if no items pass the grouping condition', () => {
        expect(groupWith(() => false, [1, 2, 3])).toEqual([]);
    });
});
