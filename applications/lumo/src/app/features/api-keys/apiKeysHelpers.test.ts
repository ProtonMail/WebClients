import { toCurrencyBaseUnits } from './apiKeysHelpers';

describe('toCurrencyBaseUnits', () => {
    it('converts whole credits to cents', () => {
        expect(toCurrencyBaseUnits(15, 'USD')).toBe(1500);
    });

    it('keeps fractional credits', () => {
        expect(toCurrencyBaseUnits(5.558, 'USD')).toBeCloseTo(555.8);
    });

    it('follows the currency decimals', () => {
        expect(toCurrencyBaseUnits(15, 'JPY')).toBe(15);
    });
});
