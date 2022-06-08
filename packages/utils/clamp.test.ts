import clamp from './clamp';

describe('clamp()', () => {
    it('returns the exact value passed in if it already lies between min & max', () => {
        expect(clamp(7, 0, 10)).toBe(7);
    });

    it('returns the min if the value passed in is lower than min', () => {
        expect(clamp(-2, 0, 10)).toBe(0);
    });

    it('returns the max if the value passed in is higher than max', () => {
        expect(clamp(12, 0, 10)).toBe(10);
    });
});
