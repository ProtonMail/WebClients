import diff from './diff';

describe('diff()', () => {
    it('finds all values that are present in a given first array but not present in a given second array', () => {
        const output = diff([1, null, 'a', true], [1, undefined, 'a', false]);

        const expected = [null, true];

        expect(output).toEqual(expected);
    });
});
