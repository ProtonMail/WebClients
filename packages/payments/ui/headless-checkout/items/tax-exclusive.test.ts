import { render, screen } from '@testing-library/react';

import { addMonths } from '@proton/shared/lib/date-fns-utc';

import { CYCLE, PLANS } from '../../../core/constants';
import type { Currency } from '../../../core/interface';
import type { PlansMap } from '../../../core/plan/interface';
import { SubscriptionMode, TaxInclusive } from '../../../core/subscription/constants';
import type { SubscriptionEstimation } from '../../../core/subscription/interface';
import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import { getHeadlessCheckout } from '../get-headless-checkout';
import { createTaxExclusiveItem } from './tax-exclusive';
import { defaultApp as app, makeCheckResult, makePlan, makePricing } from './test-helpers';

const mailPlan = makePlan({
    Name: PLANS.MAIL,
    Title: 'Mail Plus',
    Pricing: makePricing(499, 4788, 8376),
    DefaultPricing: makePricing(499, 4788, 8376),
});

describe('createTaxExclusiveItem', () => {
    it('should show net-amount and tax-exclusive items when tax is exclusive', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 4788,
            AmountDue: 5746,
            TaxInclusive: TaxInclusive.EXCLUSIVE,
            Taxes: [{ Name: 'VAT', Rate: 20, Amount: 958 }],
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const taxExclusive = result.getItem('taxExclusive');
        expect(taxExclusive.visible).toBe(true);
        expect(taxExclusive.rate).toBe(20);
        expect(taxExclusive.amount).toBe(958);
    });

    it('should hide net-amount and tax-exclusive when tax is inclusive', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 4788,
            AmountDue: 4788,
            TaxInclusive: TaxInclusive.INCLUSIVE,
            Taxes: [{ Name: 'VAT', Rate: 20, Amount: 958 }],
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        expect(result.getItem('taxExclusive').visible).toBe(false);
    });

    it('should set isTaxInclusive correctly', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };

        const inclusive = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult: makeCheckResult({
                TaxInclusive: TaxInclusive.INCLUSIVE,
                Taxes: [{ Name: 'VAT', Rate: 20, Amount: 958 }],
            }),
            app,
        });
        expect(inclusive.isTaxInclusive).toBe(true);

        const exclusive = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult: makeCheckResult({
                TaxInclusive: TaxInclusive.EXCLUSIVE,
                Taxes: [{ Name: 'VAT', Rate: 20, Amount: 958 }],
            }),
            app,
        });
        expect(exclusive.isTaxInclusive).toBe(false);
    });
});

describe('createTaxExclusiveItem - VatText style tests', () => {
    const createMockCheckResult = (overrides = {}): SubscriptionEstimation => ({
        Amount: 1000,
        AmountDue: 1200,
        Currency: 'USD',
        Cycle: CYCLE.YEARLY,
        TaxInclusive: TaxInclusive.EXCLUSIVE,
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
        requestData: {
            Plans: { [PLANS.MAIL]: 1 },
            Currency: 'USD',
            Cycle: CYCLE.YEARLY,
        },
        ...overrides,
    });

    const createMockContext = (
        checkResult: SubscriptionEstimation,
        currency: Currency = 'USD'
    ): HeadlessCheckoutContextInner =>
        ({
            checkResult,
            currency,
            isTaxExclusive: checkResult.TaxInclusive === TaxInclusive.EXCLUSIVE,
            isTaxInclusive: checkResult.TaxInclusive === TaxInclusive.INCLUSIVE,
        }) as HeadlessCheckoutContextInner;

    describe('when tax is not exclusive', () => {
        it('returns visible false when TaxInclusive is INCLUSIVE', () => {
            const checkResult = createMockCheckResult({
                TaxInclusive: TaxInclusive.INCLUSIVE,
            });

            const result = createTaxExclusiveItem(createMockContext(checkResult));

            expect(result.visible).toBe(false);
        });

        it('returns visible false when TaxInclusive is undefined', () => {
            const checkResult = createMockCheckResult({
                TaxInclusive: undefined,
            });

            const result = createTaxExclusiveItem(createMockContext(checkResult));

            expect(result.visible).toBe(false);
        });
    });

    describe('when tax is exclusive but missing data', () => {
        it('returns visible false when taxes array is empty', () => {
            const checkResult = createMockCheckResult({
                Taxes: [],
            });

            const result = createTaxExclusiveItem(createMockContext(checkResult));

            expect(result.visible).toBe(false);
        });

        it('returns visible false when taxes array is undefined', () => {
            const checkResult = createMockCheckResult({
                Taxes: undefined,
            });

            const result = createTaxExclusiveItem(createMockContext(checkResult));

            expect(result.visible).toBe(false);
        });
    });

    describe('when rendering tax information', () => {
        it('renders single tax with custom tax name', () => {
            const checkResult = createMockCheckResult({
                Taxes: [
                    {
                        Name: 'GST',
                        Rate: 15.5,
                        Amount: 155,
                    },
                ],
            });

            const result = createTaxExclusiveItem(createMockContext(checkResult));

            expect(result.visible).toBe(true);
            expect(result.taxRateElement).toBe('Tax 15.5%');
            expect(result.rate).toBe(15.5);
            expect(result.amount).toBe(155);
            expect(result.taxesQuantity).toBe(1);
            expect(result.currency).toBe('USD');
        });

        it('renders single tax with default VAT name when tax name is undefined', () => {
            const checkResult = createMockCheckResult({
                Taxes: [
                    {
                        Name: undefined as any,
                        Rate: 20,
                        Amount: 200,
                    },
                ],
            });

            const result = createTaxExclusiveItem(createMockContext(checkResult));

            expect(result.visible).toBe(true);
            expect(result.taxRateElement).toBe('Tax 20%');
            expect(result.rate).toBe(20);
            expect(result.amount).toBe(200);
        });

        it('formats tax rate with correct decimal precision', () => {
            const checkResult = createMockCheckResult({
                Taxes: [
                    {
                        Name: 'VAT',
                        Rate: 8.12345,
                        Amount: 200,
                    },
                ],
            });

            const result = createTaxExclusiveItem(createMockContext(checkResult));

            expect(result.visible).toBe(true);
            expect(result.taxRateElement).toBe('Tax 8.1235%');
            expect(result.rate).toBe(8.1235); // Rate is rounded to 4 decimal places
        });

        it('handles different currencies correctly', () => {
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

            const result = createTaxExclusiveItem(createMockContext(checkResult, 'EUR'));

            expect(result.visible).toBe(true);
            expect(result.currency).toBe('EUR');
        });
    });

    describe('rightElement and completeElement', () => {
        it('renders rightElement with Price component', () => {
            const checkResult = createMockCheckResult();

            const result = createTaxExclusiveItem(createMockContext(checkResult));

            expect(result.visible).toBe(true);
            render(result.taxAmountElement);
            expect(screen.getByTestId('taxAmount')).toBeInTheDocument();
            expect(screen.getByTestId('taxAmount')).toHaveTextContent('2');
        });

        it('renders completeElement with correct text', () => {
            const checkResult = createMockCheckResult();

            const result = createTaxExclusiveItem(createMockContext(checkResult));

            expect(result.visible).toBe(true);
            render(result.taxRateAndAmountElement);
            expect(screen.getByTestId('taxAmount')).toBeInTheDocument();
            expect(screen.getByText('20% tax:')).toBeInTheDocument();
        });

        it('renders completeElement with different currency', () => {
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

            const result = createTaxExclusiveItem(createMockContext(checkResult, 'EUR'));

            expect(result.visible).toBe(true);
            render(result.taxRateAndAmountElement);
            expect(screen.getByTestId('taxAmount')).toBeInTheDocument();
            expect(screen.getByText('21% tax:')).toBeInTheDocument();
        });
    });

    describe('multiple taxes', () => {
        it('should render multiple taxes by summing up tax amounts', () => {
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

            const result = createTaxExclusiveItem(createMockContext(checkResult));

            expect(result.visible).toBe(true);
            expect(result.rate).toBe(28);
            expect(result.amount).toBe(280);
            expect(result.taxesQuantity).toBe(3);
            expect(result.taxRateElement).toBe('Taxes 28%');
        });
    });

    describe('component structure', () => {
        it('returns correct object structure', () => {
            const checkResult = createMockCheckResult();

            const result = createTaxExclusiveItem(createMockContext(checkResult));

            expect(result.type).toBe('taxExclusive');
            expect(result).toHaveProperty('taxRateElement');
            expect(result).toHaveProperty('taxAmountElement');
            expect(result).toHaveProperty('taxRateAndAmountElement');
            expect(result).toHaveProperty('visible');
            expect(result).toHaveProperty('rate');
            expect(result).toHaveProperty('amount');
            expect(result).toHaveProperty('taxesQuantity');
            expect(result).toHaveProperty('currency');
        });
    });
});
