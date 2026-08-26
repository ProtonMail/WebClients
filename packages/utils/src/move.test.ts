import move from './move';

describe('move()', () => {
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

    /**
     * TODO:
     * This case is arguably an incorrect behaviour of this util, however for the sake
     * of not altering the public api at this time, I'm adding this test case to test
     * for regressions in case of a modification / refactor & also because this is the
     * current contract of this util.
     */
    it('returns an array with one entry "undefined" if not provided a first argument', () => {
        expect(move(undefined, 0, 0)).toEqual([undefined]);
    });
});
