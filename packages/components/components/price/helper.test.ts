import { getSimplePriceString, humanPrice } from './helper';

describe('getSimplePriceString', () => {
    it('should return a String', () => {
        expect(getSimplePriceString('EUR', 111)).toBe('1.11 €');
    });

    it('should support CHF', () => {
        expect(getSimplePriceString('CHF', 111)).toBe('CHF 1.11');
    });

    it('should support USD', () => {
        expect(getSimplePriceString('USD', 111)).toBe('US$1.11');
    });

    it('should support BRL', () => {
        expect(getSimplePriceString('BRL', 111)).toBe('BRL 1.11');
    });

    it('should remove .00 when needed', () => {
        expect(getSimplePriceString('EUR', 100)).toBe('1 €');
        expect(getSimplePriceString('EUR', 10000)).toBe('100 €');
        expect(getSimplePriceString('EUR', 10001)).toBe('100.01 €');
        expect(getSimplePriceString('EUR', 10010)).toBe('100.10 €');
    });

    it('should return negative amount', () => {
        expect(getSimplePriceString('EUR', -123)).toBe('-1.23 €');
        expect(getSimplePriceString('CHF', -111)).toBe('-CHF 1.11');
        expect(getSimplePriceString('USD', -111)).toBe('-US$1.11');
        expect(getSimplePriceString('BRL', -111)).toBe('-BRL 1.11');
    });

    it('should support suffix', () => {
        expect(getSimplePriceString('EUR', 111, ' / month')).toBe('1.11 € / month');
    });
});

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
