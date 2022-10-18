import humanPrice, { humanPriceWithCurrency } from '../../lib/helpers/humanPrice';

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

describe('humanPriceWithCurrency', () => {
    it('should return a String', () => {
        expect(humanPriceWithCurrency(111, 'EUR')).toBe('1.11 €');
    });

    it('should support divisor', () => {
        expect(humanPriceWithCurrency(100, 'EUR', 1)).toBe('100 €');
    });

    it('should throw an error if empty parameters', () => {
        // @ts-expect-error
        expect(() => humanPriceWithCurrency()).toThrow();
    });

    it('should remove .00 when needed', () => {
        expect(humanPriceWithCurrency(100, 'EUR')).toBe('1 €');
        expect(humanPriceWithCurrency(120, 'EUR')).toBe('1.20 €');
        expect(humanPriceWithCurrency(123, 'EUR')).toBe('1.23 €');
    });

    it('should support CHF', () => {
        expect(humanPriceWithCurrency(111, 'CHF')).toBe('CHF 1.11');
    });

    it('should support USD', () => {
        expect(humanPriceWithCurrency(111, 'USD')).toBe('$1.11');
    });

    it('should return negative amount', () => {
        expect(humanPriceWithCurrency(-123, 'EUR')).toBe('-1.23 €');
        expect(humanPriceWithCurrency(-111, 'CHF')).toBe('-CHF 1.11');
        expect(humanPriceWithCurrency(-111, 'USD')).toBe('-$1.11');
    });
});
