import { PAYMENT_METHOD_TYPES } from '../constants';
import type { Currency } from '../interface';
import {
    getIsCurrencyOverriden,
    getMethodSupportedCurrencies,
    isCurrencySupportedByMethod,
    updateCurrencyOverride,
} from './useCurrencyOverride';

describe('currency-override', () => {
    describe('getMethodSupportedCurrencies', () => {
        it('should return EUR for SEPA', () => {
            expect(getMethodSupportedCurrencies(PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT)).toEqual(['EUR']);
        });

        it('should return EUR for iDEAL', () => {
            expect(getMethodSupportedCurrencies(PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL)).toEqual(['EUR']);
        });

        it('should return undefined for unrestricted methods', () => {
            expect(getMethodSupportedCurrencies(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD)).toBeUndefined();
            expect(getMethodSupportedCurrencies(undefined)).toBeUndefined();
        });
    });

    describe('isCurrencySupportedByMethod', () => {
        it.each([PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT, PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL])(
            'should support EUR but not USD for %s',
            (method) => {
                expect(isCurrencySupportedByMethod(method, 'EUR')).toBe(true);
                expect(isCurrencySupportedByMethod(method, 'USD')).toBe(false);
            }
        );

        it('should support any currency for unrestricted methods', () => {
            expect(isCurrencySupportedByMethod(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD, 'USD')).toBe(true);
            expect(isCurrencySupportedByMethod(undefined, 'USD')).toBe(true);
        });
    });

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
                currentCurrency: 'EUR',
                currencyBeforeOverride: 'USD',
            });
            expect(result).toBe(true);
        });
    });

    describe('updateCurrencyOverride', () => {
        describe('should override currency to EUR', () => {
            it.each([PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT, PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL])(
                'when user selects %s and current currency is not EUR',
                (method) => {
                    const result = updateCurrencyOverride({
                        currentCurrency: 'USD',
                        currencyBeforeOverride: undefined,
                        currentSelectedMethod: undefined,
                        newSelectedMethod: method,
                    });

                    expect(result).toEqual({
                        currency: 'EUR',
                        currencyBeforeOverride: 'USD',
                    });
                }
            );

            it.each([PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT, PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL])(
                'when user already has %s selected and no new method is selected',
                (method) => {
                    const result = updateCurrencyOverride({
                        currentCurrency: 'USD',
                        currencyBeforeOverride: undefined,
                        currentSelectedMethod: method,
                        newSelectedMethod: undefined,
                    });

                    expect(result).toEqual({
                        currency: 'EUR',
                        currencyBeforeOverride: 'USD',
                    });
                }
            );
        });

        describe('should NOT override currency to EUR', () => {
            it('when current currency is already EUR', () => {
                const result = updateCurrencyOverride({
                    currentCurrency: 'EUR',
                    currencyBeforeOverride: undefined,
                    currentSelectedMethod: undefined,
                    newSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
                });

                expect(result).toBeUndefined();
            });

            it('when user selects an unrestricted payment method', () => {
                const result = updateCurrencyOverride({
                    currentCurrency: 'USD',
                    currencyBeforeOverride: undefined,
                    currentSelectedMethod: undefined,
                    newSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                });

                expect(result).toBeUndefined();
            });

            it('when user has a restricted method selected but switches to another method without previous override', () => {
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
            it('when switching from a restricted method to an unrestricted one and currency was overridden', () => {
                const result = updateCurrencyOverride({
                    currentCurrency: 'EUR',
                    currencyBeforeOverride: 'USD',
                    currentSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
                    newSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                });

                expect(result).toEqual({
                    currency: 'USD',
                    currencyBeforeOverride: undefined,
                });
            });

            it('when switching from iDEAL to PayPal and currency was overridden', () => {
                const result = updateCurrencyOverride({
                    currentCurrency: 'EUR',
                    currencyBeforeOverride: 'CHF',
                    currentSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL,
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
                    currentCurrency: 'EUR',
                    currencyBeforeOverride: undefined,
                    currentSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
                    newSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                });

                expect(result).toBeUndefined();
            });

            it('when current method is unrestricted', () => {
                const result = updateCurrencyOverride({
                    currentCurrency: 'EUR',
                    currencyBeforeOverride: 'USD',
                    currentSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
                    newSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
                });

                expect(result).toBeUndefined();
            });

            it('when no new method is selected and currency is already EUR', () => {
                const result = updateCurrencyOverride({
                    currentCurrency: 'EUR',
                    currencyBeforeOverride: 'USD',
                    currentSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
                    newSelectedMethod: undefined,
                });

                expect(result).toBeUndefined();
            });

            it('when switching between two restricted methods that do not support the previous currency', () => {
                const result = updateCurrencyOverride({
                    currentCurrency: 'EUR',
                    currencyBeforeOverride: 'USD',
                    currentSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
                    newSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL,
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
                    currentCurrency: 'EUR',
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
                    if (currency !== 'EUR') {
                        const result = updateCurrencyOverride({
                            currentCurrency: currency,
                            currencyBeforeOverride: undefined,
                            currentSelectedMethod: undefined,
                            newSelectedMethod: PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL,
                        });

                        expect(result).toEqual({
                            currency: 'EUR',
                            currencyBeforeOverride: currency,
                        });
                    }
                });
            });
        });
    });
});
