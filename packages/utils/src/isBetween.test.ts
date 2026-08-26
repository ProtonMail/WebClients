import isBetween from './isBetween';

describe('isBetween()', () => {
    it('returns true if a given number is between two other given number', () => {
        expect(isBetween(5, -10, 10)).toBe(true);
    });

    it('returns true if a given number is exactly equal to the min', () => {
        expect(isBetween(-10, -10, 10)).toBe(true);
    });

    it('returns false if a given number is exactly equal to the max', () => {
        expect(isBetween(10, -10, 10)).toBe(false);
    });

    it('returns false if a given number is outside two other given number', () => {
        expect(isBetween(20, -10, 10)).toBe(false);
    });
});
