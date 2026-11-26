import { getAmountButtonProps } from './getAmountButtonProps';

describe('getAmountButtonProps', () => {
    it('shows a money preset as a price in the currency', () => {
        expect(getAmountButtonProps({ value: 5000, amount: 1000, currency: 'EUR', inWholeUnits: false })).toEqual({
            value: 5000,
            amount: 1000,
            currency: 'EUR',
        });
    });

    it.each([
        { currency: 'USD' as const, value: 5000, amount: 10000, expected: { value: 50, amount: 100 } },
        { currency: 'JPY' as const, value: 50, amount: 100, expected: { value: 50, amount: 100 } },
    ])('shows a whole-unit preset in $currency as a plain count', ({ currency, value, amount, expected }) => {
        expect(getAmountButtonProps({ value, amount, currency, inWholeUnits: true })).toEqual(expected);
    });
});
