import mod from './mod';

describe('mod()', () => {
    it('should return a positive remainder', () => {
        expect(mod(-4, 3)).toEqual(2);
        expect(mod(-3, 3)).toEqual(0);
        expect(mod(-2, 3)).toEqual(1);
        expect(mod(-1, 3)).toEqual(2);
        expect(mod(0, 3)).toEqual(0);
        expect(mod(1, 3)).toEqual(1);
        expect(mod(2, 3)).toEqual(2);
        expect(mod(3, 3)).toEqual(0);
        expect(mod(4, 3)).toEqual(1);
    });
});
