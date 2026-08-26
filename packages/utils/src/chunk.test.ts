import chunk from './chunk';

describe('chunk()', () => {
    it('creates an array of chunks of a given other array of fixed size', () => {
        const output = chunk(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'], 3);

        const expected = [
            ['a', 'b', 'c'],
            ['d', 'e', 'f'],
            ['g', 'h', 'i'],
        ];

        expect(output).toEqual(expected);
    });

    it('defaults to a chunk size of 1 ', () => {
        const output = chunk(['a', 'b', 'c']);

        const expected = [['a'], ['b'], ['c']];

        expect(output).toEqual(expected);
    });

    it('creates the last chunk equal to the size of remaining elements if not exactly divisible by the chunk size', () => {
        const output = chunk(['a', 'b', 'c', 'd', 'e'], 2);

        const expected = [['a', 'b'], ['c', 'd'], ['e']];

        expect(output).toEqual(expected);
    });

    it("doesn't mutate the input array", () => {
        const input = ['a', 'b', 'c'];

        chunk(input);

        expect(input).toEqual(['a', 'b', 'c']);
    });

    it('returns an empty array given no input', () => {
        const output = chunk();

        expect(output).toEqual([]);
    });
});
