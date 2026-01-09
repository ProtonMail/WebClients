import { formatPriceWithoutCurrency, getSimplePriceString } from './helper';

describe('getSimplePriceString', () => {
    const NBSP = '\u00A0';

    it('should return a String', () => {
        expect(getSimplePriceString('EUR', 111)).toBe(`1.11${NBSP}€`);
    });

    it('should support CHF', () => {
        expect(getSimplePriceString('CHF', 111)).toBe(`CHF${NBSP}1.11`);
    });

    it('should support USD', () => {
        expect(getSimplePriceString('USD', 111)).toBe('US$1.11');
    });

    it('should support BRL', () => {
        expect(getSimplePriceString('BRL', 111)).toBe(`BRL${NBSP}1.11`);
    });

    it('should remove .00 when needed', () => {
        expect(getSimplePriceString('EUR', 100)).toBe(`1${NBSP}€`);
        expect(getSimplePriceString('EUR', 10000)).toBe(`100${NBSP}€`);
        expect(getSimplePriceString('EUR', 10001)).toBe(`100.01${NBSP}€`);
        expect(getSimplePriceString('EUR', 10010)).toBe(`100.10${NBSP}€`);
    });

    it('should return negative amount', () => {
        expect(getSimplePriceString('EUR', -123)).toBe(`-1.23${NBSP}€`);
        expect(getSimplePriceString('CHF', -111)).toBe(`-CHF${NBSP}1.11`);
        expect(getSimplePriceString('USD', -111)).toBe('-US$1.11');
        expect(getSimplePriceString('BRL', -111)).toBe(`-BRL${NBSP}1.11`);
    });

    it('should support suffix', () => {
        expect(getSimplePriceString('EUR', 111, ' / month')).toBe(`1.11${NBSP}€ / month`);
    });

    it('should render PLN', () => {
        expect(getSimplePriceString('PLN', 123)).toBe(`1.23${NBSP}zł`);
    });

    it('should render JPY', () => {
        expect(getSimplePriceString('JPY', 123)).toBe(`¥123`);
    });

    it('should render KRW', () => {
        expect(getSimplePriceString('KRW', 123)).toBe(`₩123`);
    });

    it('should render SGD', () => {
        expect(getSimplePriceString('SGD', 123)).toBe(`SGD${NBSP}1.23`);
    });

    it('should render HKD', () => {
        expect(getSimplePriceString('HKD', 123)).toBe(`HK$1.23`);
    });
});

describe('humanPrice', () => {
    it('should return a String', () => {
        expect(formatPriceWithoutCurrency(111, 'USD')).toBe('1.11');
    });

    it('should support divisor', () => {
        expect(formatPriceWithoutCurrency(100, 'JPY')).toBe('100');
    });

    it('should remove .00 when needed', () => {
        expect(formatPriceWithoutCurrency(100, 'USD')).toBe('1');
        expect(formatPriceWithoutCurrency(120, 'USD')).toBe('1.20');
        expect(formatPriceWithoutCurrency(123, 'USD')).toBe('1.23');
    });

    it('should return positive amount', () => {
        expect(formatPriceWithoutCurrency(-100, 'USD')).toBe('1');
        expect(formatPriceWithoutCurrency(-123, 'USD')).toBe('1.23');
    });
});
