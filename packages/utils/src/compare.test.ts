import compare from './compare';

describe('compare()', () => {
    it('returns 1 if a is greater than b', () => {
        const result = compare(2, 1);

        expect(result).toBe(1);
    });

    it('returns -1 if a is greater than b', () => {
        const result = compare(1, 2);

        expect(result).toBe(-1);
    });

    it('returns 0 if a is equal to b', () => {
        const result = compare(1, 1);

        expect(result).toBe(0);
    });

    it('acts as a numeric comparator between two values, consistent with the array.prototype.sort api', () => {
        const input = [3, 8, 9, 1, 4, 6, 7, 5, 2];

        const output = input.sort(compare);

        const expected = [1, 2, 3, 4, 5, 6, 7, 8, 9];

        expect(output).toEqual(expected);
    });
});
