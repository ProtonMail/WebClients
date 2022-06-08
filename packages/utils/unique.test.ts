import unique from './unique';

describe('unique()', () => {
    it('should return same', () => {
        expect(unique([1, 2])).toEqual([1, 2]);
    });

    it('should only return unique items', () => {
        expect(unique([1, 2, 1])).toEqual([1, 2]);
    });
});
