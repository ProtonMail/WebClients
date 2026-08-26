import remove from './remove';

describe('remove()', () => {
    it('removes an item from an array', () => {
        const output = remove(['a', 'b', 'c'], 'b');
        expect(output).toEqual(['a', 'c']);
    });

    it('removes only the first occurence should there be multiple', () => {
        const output = remove(['a', 'b', 'c', 'b', 'd', 'b'], 'b');
        expect(output).toEqual(['a', 'c', 'b', 'd', 'b']);
    });

    it('returns the original array if the given element does not occur in the input array', () => {
        const input = ['a', 'b', 'c', 'd'];
        const output = remove(input, 'e');
        expect(output).toBe(input);
    });
});
