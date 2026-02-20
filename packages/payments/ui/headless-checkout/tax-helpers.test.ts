import { addMonths } from '@proton/shared/lib/date-fns-utc';

import type { RequiredCheckResponse } from '../../core/checkout';
import { CYCLE } from '../../core/constants';
import { SubscriptionMode, TaxInclusive } from '../../core/subscription/constants';
import { formatTax } from './tax-helpers';

describe('formatTax', () => {
    const createMockCheckResult = (overrides = {}): RequiredCheckResponse => ({
        Amount: 1000,
        AmountDue: 1200,
        Currency: 'USD',
        Cycle: CYCLE.YEARLY,
        TaxInclusive: TaxInclusive.INCLUSIVE,
        Coupon: null,
        SubscriptionMode: SubscriptionMode.Regular,
        BaseRenewAmount: null,
        RenewCycle: null,
        PeriodEnd: +addMonths(new Date(), (overrides as any).Cycle ?? CYCLE.YEARLY) / 1000,
        Taxes: [
            {
                Name: 'VAT',
                Rate: 20,
                Amount: 200,
            },
        ],
        ...overrides,
    });

    describe('when no taxes exist', () => {
        it('returns null when taxes array is undefined', () => {
            const checkResult = createMockCheckResult({
                Taxes: undefined,
            });

            const result = formatTax(checkResult);

            expect(result).toBeNull();
        });

        it('returns null when taxes array is empty', () => {
            const checkResult = createMockCheckResult({
                Taxes: [],
            });

            const result = formatTax(checkResult);

            expect(result).toBeNull();
        });

        it('returns null when taxes array has zero length', () => {
            const checkResult = createMockCheckResult({
                Taxes: [] as any,
            });

            const result = formatTax(checkResult);

            expect(result).toBeNull();
        });
    });

    describe('single tax scenarios', () => {
        it('formats single tax with custom name correctly', () => {
            const checkResult = createMockCheckResult({
                Taxes: [
                    {
                        Name: 'GST',
                        Rate: 15.5,
                        Amount: 155,
                    },
                ],
            });

            const result = formatTax(checkResult);

            expect(result).toEqual({
                amount: 155,
                rate: 15.5,
                inclusive: TaxInclusive.INCLUSIVE,
                currency: 'USD',
                taxName: 'GST',
                taxesQuantity: 1,
            });
        });

        it('uses VAT fallback when tax name is undefined', () => {
            const checkResult = createMockCheckResult({
                Taxes: [
                    {
                        Name: undefined as any,
                        Rate: 20,
                        Amount: 200,
                    },
                ],
            });

            const result = formatTax(checkResult);

            expect(result).toEqual({
                amount: 200,
                rate: 20,
                inclusive: TaxInclusive.INCLUSIVE,
                currency: 'USD',
                taxName: 'VAT',
                taxesQuantity: 1,
            });
        });

        it('uses VAT fallback when tax name is null', () => {
            const checkResult = createMockCheckResult({
                Taxes: [
                    {
                        Name: null as any,
                        Rate: 20,
                        Amount: 200,
                    },
                ],
            });

            const result = formatTax(checkResult);

            expect(result).toEqual({
                amount: 200,
                rate: 20,
                inclusive: TaxInclusive.INCLUSIVE,
                currency: 'USD',
                taxName: 'VAT',
                taxesQuantity: 1,
            });
        });

        it('uses empty string tax name when provided', () => {
            const checkResult = createMockCheckResult({
                Taxes: [
                    {
                        Name: '',
                        Rate: 20,
                        Amount: 200,
                    },
                ],
            });

            const result = formatTax(checkResult);

            expect(result).toEqual({
                amount: 200,
                rate: 20,
                inclusive: TaxInclusive.INCLUSIVE,
                currency: 'USD',
                taxName: '',
                taxesQuantity: 1,
            });
        });

        it('handles zero tax rate and amount', () => {
            const checkResult = createMockCheckResult({
                Taxes: [
                    {
                        Name: 'Exempt',
                        Rate: 0,
                        Amount: 0,
                    },
                ],
            });

            const result = formatTax(checkResult);

            expect(result).toEqual({
                amount: 0,
                rate: 0,
                inclusive: TaxInclusive.INCLUSIVE,
                currency: 'USD',
                taxName: 'Exempt',
                taxesQuantity: 1,
            });
        });

        it('formats decimal rate with correct precision', () => {
            const checkResult = createMockCheckResult({
                Taxes: [
                    {
                        Name: 'VAT',
                        Rate: 8.12345,
                        Amount: 200,
                    },
                ],
            });

            const result = formatTax(checkResult);

            expect(result).toEqual({
                amount: 200,
                rate: 8.1235, // withDecimalPrecision should format to 4 decimal places
                inclusive: TaxInclusive.INCLUSIVE,
                currency: 'USD',
                taxName: 'VAT',
                taxesQuantity: 1,
            });
        });
    });

    describe('multiple tax scenarios', () => {
        it('sums amounts and rates for multiple taxes', () => {
            const checkResult = createMockCheckResult({
                Taxes: [
                    {
                        Name: 'VAT',
                        Rate: 20,
                        Amount: 200,
                    },
                    {
                        Name: 'State Tax',
                        Rate: 5,
                        Amount: 50,
                    },
                    {
                        Name: 'City Tax',
                        Rate: 3,
                        Amount: 30,
                    },
                ],
            });

            const result = formatTax(checkResult);

            expect(result).toEqual({
                amount: 280, // 200 + 50 + 30
                rate: 28, // 20 + 5 + 3
                inclusive: TaxInclusive.INCLUSIVE,
                currency: 'USD',
                taxName: 'VAT', // Always VAT for multiple taxes
                taxesQuantity: 3,
            });
        });

        it('uses VAT name for multiple taxes regardless of individual names', () => {
            const checkResult = createMockCheckResult({
                Taxes: [
                    {
                        Name: 'GST',
                        Rate: 15,
                        Amount: 150,
                    },
                    {
                        Name: 'Provincial Tax',
                        Rate: 8,
                        Amount: 80,
                    },
                ],
            });

            const result = formatTax(checkResult);

            expect(result).toEqual({
                amount: 230,
                rate: 23,
                inclusive: TaxInclusive.INCLUSIVE,
                currency: 'USD',
                taxName: 'VAT', // Always VAT for multiple taxes
                taxesQuantity: 2,
            });
        });

        it('formats combined decimal rates with correct precision', () => {
            const checkResult = createMockCheckResult({
                Taxes: [
                    {
                        Name: 'Tax 1',
                        Rate: 8.12345,
                        Amount: 100,
                    },
                    {
                        Name: 'Tax 2',
                        Rate: 12.67891,
                        Amount: 150,
                    },
                ],
            });

            const result = formatTax(checkResult);

            expect(result).toEqual({
                amount: 250,
                rate: 20.8024, // (8.12345 + 12.67891) formatted to 4 decimal places
                inclusive: TaxInclusive.INCLUSIVE,
                currency: 'USD',
                taxName: 'VAT',
                taxesQuantity: 2,
            });
        });
    });

    describe('currency and tax inclusive handling', () => {
        it('preserves the currency from checkResult', () => {
            const checkResult = createMockCheckResult({
                Currency: 'EUR',
                Taxes: [
                    {
                        Name: 'VAT',
                        Rate: 21,
                        Amount: 210,
                    },
                ],
            });

            const result = formatTax(checkResult);

            expect(result).toEqual({
                amount: 210,
                rate: 21,
                inclusive: TaxInclusive.INCLUSIVE,
                currency: 'EUR',
                taxName: 'VAT',
                taxesQuantity: 1,
            });
        });

        it('uses TaxInclusive from checkResult when provided', () => {
            const checkResult = createMockCheckResult({
                TaxInclusive: TaxInclusive.EXCLUSIVE,
                Taxes: [
                    {
                        Name: 'VAT',
                        Rate: 20,
                        Amount: 200,
                    },
                ],
            });

            const result = formatTax(checkResult);

            expect(result).toEqual({
                amount: 200,
                rate: 20,
                inclusive: TaxInclusive.EXCLUSIVE,
                currency: 'USD',
                taxName: 'VAT',
                taxesQuantity: 1,
            });
        });

        it('defaults to INCLUSIVE when TaxInclusive is undefined', () => {
            const checkResult = createMockCheckResult({
                TaxInclusive: undefined,
                Taxes: [
                    {
                        Name: 'VAT',
                        Rate: 20,
                        Amount: 200,
                    },
                ],
            });

            const result = formatTax(checkResult);

            expect(result).toEqual({
                amount: 200,
                rate: 20,
                inclusive: TaxInclusive.INCLUSIVE,
                currency: 'USD',
                taxName: 'VAT',
                taxesQuantity: 1,
            });
        });
    });

    describe('edge cases', () => {
        it('handles very high tax rates', () => {
            const checkResult = createMockCheckResult({
                Taxes: [
                    {
                        Name: 'High Tax',
                        Rate: 99.9999,
                        Amount: 999,
                    },
                ],
            });

            const result = formatTax(checkResult);

            expect(result).toEqual({
                amount: 999,
                rate: 99.9999, // withDecimalPrecision should maintain 4 decimal places
                inclusive: TaxInclusive.INCLUSIVE,
                currency: 'USD',
                taxName: 'High Tax',
                taxesQuantity: 1,
            });
        });

        it('handles very small decimal amounts', () => {
            const checkResult = createMockCheckResult({
                Taxes: [
                    {
                        Name: 'Micro Tax',
                        Rate: 0.0001,
                        Amount: 1,
                    },
                ],
            });

            const result = formatTax(checkResult);

            expect(result).toEqual({
                amount: 1,
                rate: 0.0001,
                inclusive: TaxInclusive.INCLUSIVE,
                currency: 'USD',
                taxName: 'Micro Tax',
                taxesQuantity: 1,
            });
        });

        it('handles maximum precision rates correctly', () => {
            const checkResult = createMockCheckResult({
                Taxes: [
                    {
                        Name: 'Precise Tax',
                        Rate: 12.123456789,
                        Amount: 100,
                    },
                ],
            });

            const result = formatTax(checkResult);

            expect(result).toEqual({
                amount: 100,
                rate: 12.1235, // Should be truncated to 4 decimal places by withDecimalPrecision
                inclusive: TaxInclusive.INCLUSIVE,
                currency: 'USD',
                taxName: 'Precise Tax',
                taxesQuantity: 1,
            });
        });

        it('handles single tax with missing Name property gracefully', () => {
            const checkResult = createMockCheckResult({
                Taxes: [
                    {
                        Rate: 20,
                        Amount: 200,
                    } as any, // Missing Name property
                ],
            });

            const result = formatTax(checkResult);

            expect(result).toEqual({
                amount: 200,
                rate: 20,
                inclusive: TaxInclusive.INCLUSIVE,
                currency: 'USD',
                taxName: 'VAT', // Should fallback to VAT
                taxesQuantity: 1,
            });
        });
    });

    describe('tax exclusive scenarios', () => {
        it('handles single tax with exclusive setting', () => {
            const checkResult = createMockCheckResult({
                TaxInclusive: TaxInclusive.EXCLUSIVE,
                Taxes: [
                    {
                        Name: 'VAT',
                        Rate: 20,
                        Amount: 200,
                    },
                ],
            });

            const result = formatTax(checkResult);

            expect(result).toEqual({
                amount: 200,
                rate: 20,
                inclusive: TaxInclusive.EXCLUSIVE,
                currency: 'USD',
                taxName: 'VAT',
                taxesQuantity: 1,
            });
        });

        it('handles multiple taxes with exclusive setting', () => {
            const checkResult = createMockCheckResult({
                TaxInclusive: TaxInclusive.EXCLUSIVE,
                Taxes: [
                    {
                        Name: 'VAT',
                        Rate: 20,
                        Amount: 200,
                    },
                    {
                        Name: 'State Tax',
                        Rate: 5,
                        Amount: 50,
                    },
                ],
            });

            const result = formatTax(checkResult);

            expect(result).toEqual({
                amount: 250, // 200 + 50
                rate: 25, // 20 + 5
                inclusive: TaxInclusive.EXCLUSIVE,
                currency: 'USD',
                taxName: 'VAT', // Always VAT for multiple taxes
                taxesQuantity: 2,
            });
        });
    });
});
