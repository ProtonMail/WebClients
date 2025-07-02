import { PAYMENT_METHOD_TYPES } from '../constants';
import { type Currency } from '../interface';
import { SEPA_CURRENCY, getIsCurrencyOverriden, updateCurrencyOverride } from './useSepaCurrencyOverride';

describe('sepa-currency-override', () => {
    describe('getIsCurrencyOverriden', () => {
        it('should return false when currencyBeforeOverride is undefined', () => {
            const result = getIsCurrencyOverriden({
                currentCurrency: 'USD',
                currencyBeforeOverride: undefined,
            });
            expect(result).toBe(false);
        });

        it('should return false when currencyBeforeOverride is the same as currentCurrency', () => {
            const result = getIsCurrencyOverriden({
                currentCurrency: 'USD',
                currencyBeforeOverride: 'USD',
            });
            expect(result).toBe(false);
        });

        it('should return true when currencyBeforeOverride is different from currentCurrency', () => {
            const result = getIsCurrencyOverriden({
                currentCurrency: SEPA_CURRENCY,
                currencyBeforeOverride: 'USD',
            });
            expect(result).toBe(true);
        });
    });

    describe('updateCurrencyOverride', () => {
        describe('should override currency to EUR', () => {
            it('when user selects SEPA_DIRECT_DEBIT and current currency is not EUR', () => {
                const result = updateCurrencyOverride({
                    currentCurrency: 'USD',
                    currencyBeforeOverride: undefined,
                    currentSelectedMethod: undefined,
                    newSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
                });

                expect(result).toEqual({
                    currency: SEPA_CURRENCY,
                    currencyBeforeOverride: 'USD',
                });
            });

            it('when user already has SEPA_DIRECT_DEBIT selected and no new method is selected', () => {
                const result = updateCurrencyOverride({
                    currentCurrency: 'USD',
                    currencyBeforeOverride: undefined,
                    currentSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
                    newSelectedMethod: undefined,
                });

                expect(result).toEqual({
                    currency: SEPA_CURRENCY,
                    currencyBeforeOverride: 'USD',
                });
            });
        });

        describe('should NOT override currency to EUR', () => {
            it('when current currency is already EUR', () => {
                const result = updateCurrencyOverride({
                    currentCurrency: SEPA_CURRENCY,
                    currencyBeforeOverride: undefined,
                    currentSelectedMethod: undefined,
                    newSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
                });

                expect(result).toBeUndefined();
            });

            it('when user selects a non-SEPA payment method', () => {
                const result = updateCurrencyOverride({
                    currentCurrency: 'USD',
                    currencyBeforeOverride: undefined,
                    currentSelectedMethod: undefined,
                    newSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                });

                expect(result).toBeUndefined();
            });

            it('when user has SEPA selected but switches to another method without previous override', () => {
                const result = updateCurrencyOverride({
                    currentCurrency: 'USD',
                    currencyBeforeOverride: undefined,
                    currentSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
                    newSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                });

                expect(result).toBeUndefined();
            });
        });

        describe('should change currency back', () => {
            it('when switching from SEPA to another method and currency was overridden', () => {
                const result = updateCurrencyOverride({
                    currentCurrency: SEPA_CURRENCY,
                    currencyBeforeOverride: 'USD',
                    currentSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
                    newSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                });

                expect(result).toEqual({
                    currency: 'USD',
                    currencyBeforeOverride: undefined,
                });
            });

            it('when switching from SEPA to PayPal and currency was overridden', () => {
                const result = updateCurrencyOverride({
                    currentCurrency: SEPA_CURRENCY,
                    currencyBeforeOverride: 'CHF',
                    currentSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
                    newSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
                });

                expect(result).toEqual({
                    currency: 'CHF',
                    currencyBeforeOverride: undefined,
                });
            });
        });

        describe('should NOT change currency back', () => {
            it('when currency was not overridden', () => {
                const result = updateCurrencyOverride({
                    currentCurrency: SEPA_CURRENCY,
                    currencyBeforeOverride: undefined,
                    currentSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
                    newSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                });

                expect(result).toBeUndefined();
            });

            it('when current method is not SEPA', () => {
                const result = updateCurrencyOverride({
                    currentCurrency: SEPA_CURRENCY,
                    currencyBeforeOverride: 'USD',
                    currentSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                    newSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
                });

                expect(result).toBeUndefined();
            });

            it('when no new method is selected and currency is already EUR', () => {
                const result = updateCurrencyOverride({
                    currentCurrency: SEPA_CURRENCY,
                    currencyBeforeOverride: 'USD',
                    currentSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
                    newSelectedMethod: undefined,
                });

                expect(result).toBeUndefined();
            });

            it('when switching from SEPA to SEPA', () => {
                const result = updateCurrencyOverride({
                    currentCurrency: SEPA_CURRENCY,
                    currencyBeforeOverride: 'USD',
                    currentSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
                    newSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
                });

                expect(result).toBeUndefined();
            });
        });

        describe('edge cases', () => {
            it('should handle undefined currentSelectedMethod', () => {
                const result = updateCurrencyOverride({
                    currentCurrency: 'USD',
                    currencyBeforeOverride: undefined,
                    currentSelectedMethod: undefined,
                    newSelectedMethod: undefined,
                });

                expect(result).toBeUndefined();
            });

            it('should prioritize currency change back over currency override', () => {
                const result = updateCurrencyOverride({
                    currentCurrency: SEPA_CURRENCY,
                    currencyBeforeOverride: 'USD',
                    currentSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
                    newSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                });

                expect(result).toEqual({
                    currency: 'USD',
                    currencyBeforeOverride: undefined,
                });
            });

            it('should handle all currency types correctly', () => {
                const currencies: Currency[] = ['USD', 'EUR', 'CHF', 'GBP'];

                currencies.forEach((currency) => {
                    if (currency !== SEPA_CURRENCY) {
                        const result = updateCurrencyOverride({
                            currentCurrency: currency,
                            currencyBeforeOverride: undefined,
                            currentSelectedMethod: undefined,
                            newSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
                        });

                        expect(result).toEqual({
                            currency: SEPA_CURRENCY,
                            currencyBeforeOverride: currency,
                        });
                    }
                });
            });
        });
    });
});
