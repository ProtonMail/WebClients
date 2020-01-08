import humanPrice from '../../lib/helpers/humanPrice';

describe('humanPrice', () => {
    it('should return a String', () => {
        expect(humanPrice(111)).toBe('1.11');
    });

    it('should support divisor', () => {
        expect(humanPrice(100, 1)).toBe('100');
    });

    it('should support empty parameters', () => {
        expect(humanPrice()).toBe('0');
    });

    it('should remove .00 when needed', () => {
        expect(humanPrice(100)).toBe('1');
        expect(humanPrice(120)).toBe('1.20');
        expect(humanPrice(123)).toBe('1.23');
    });

    it('should return positive amount', () => {
        expect(humanPrice(-100)).toBe('1');
        expect(humanPrice(-123)).toBe('1.23');
    });
});
