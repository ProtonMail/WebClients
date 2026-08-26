import removeIndex from './removeIndex';

describe('removeIndex()', () => {
    it('removes item at a given index from an array', () => {
        const output = removeIndex(['a', 'b', 'c', 'd', 'e'], 2);
        const expected = ['a', 'b', 'd', 'e'];
        expect(output).toEqual(expected);
    });
});
