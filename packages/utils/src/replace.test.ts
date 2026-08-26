import replace from './replace';

describe('replace()', () => {
    it('replaces an item from an array', () => {
        const output = replace(['a', 'b', 'c'], 'b', 'x');
        expect(output).toEqual(['a', 'x', 'c']);
    });

    it('replaces only the first occurence should there be multiple', () => {
        const output = replace(['a', 'b', 'c', 'b', 'd', 'b'], 'b', 'x');
        expect(output).toEqual(['a', 'x', 'c', 'b', 'd', 'b']);
    });

    it('returns the original array if the given element does not occur in the input array', () => {
        const input = ['a', 'b', 'c', 'd'];
        const output = replace(input, 'e', 'x');
        expect(output).toBe(input);
    });
});
