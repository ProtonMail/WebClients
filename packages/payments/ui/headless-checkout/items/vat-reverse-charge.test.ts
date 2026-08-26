import { addMonths } from '@proton/shared/lib/date-fns-utc';

import { CYCLE, PLANS } from '../../../core/constants';
import type { Currency } from '../../../core/interface';
import type { PlansMap } from '../../../core/plan/interface';
import { SubscriptionMode, TaxMode } from '../../../core/subscription/constants';
import type { SubscriptionEstimation } from '../../../core/subscription/interface';
import type { HeadlessCheckoutContextInner } from '../get-headless-checkout';
import { getHeadlessCheckout } from '../get-headless-checkout';
import { defaultApp as app, makeCheckResult, makePlan, makePricing } from './test-helpers';
import { createVatReverseChargeItem, isVatReverseChargeApplicable } from './vat-reverse-charge';

const mailPlan = makePlan({
    Name: PLANS.MAIL,
    Title: 'Mail Plus',
    Pricing: makePricing(499, 4788, 8376),
    DefaultPricing: makePricing(499, 4788, 8376),
});

describe('isVatReverseChargeApplicable', () => {
    it('should return true when TaxMode is REVERSE_CHARGE and Taxes is empty', () => {
        const checkResult = makeCheckResult({
            TaxMode: TaxMode.REVERSE_CHARGE,
            Taxes: [],
        });

        expect(isVatReverseChargeApplicable(checkResult)).toBe(true);
    });

    it('should return true when TaxMode is REVERSE_CHARGE and Taxes is undefined', () => {
        const checkResult = makeCheckResult({
            TaxMode: TaxMode.REVERSE_CHARGE,
            Taxes: undefined,
        });

        expect(isVatReverseChargeApplicable(checkResult)).toBe(true);
    });

    it('should return false when TaxMode is EXCLUSIVE and Taxes is empty', () => {
        const checkResult = makeCheckResult({
            TaxMode: TaxMode.EXCLUSIVE,
            Taxes: [],
        });

        expect(isVatReverseChargeApplicable(checkResult)).toBe(false);
    });

    it('should return false when TaxMode is EXCLUSIVE and Taxes is undefined', () => {
        const checkResult = makeCheckResult({
            TaxMode: TaxMode.EXCLUSIVE,
            Taxes: undefined,
        });

        expect(isVatReverseChargeApplicable(checkResult)).toBe(false);
    });

    it('should return false when TaxMode is EXCLUSIVE but Taxes has entries', () => {
        const checkResult = makeCheckResult({
            TaxMode: TaxMode.EXCLUSIVE,
            Taxes: [{ Name: 'VAT', Rate: 20, Amount: 200 }],
        });

        expect(isVatReverseChargeApplicable(checkResult)).toBe(false);
    });

    it('should return false when TaxMode is INCLUSIVE and Taxes is empty', () => {
        const checkResult = makeCheckResult({
            TaxMode: TaxMode.INCLUSIVE,
            Taxes: [],
        });

        expect(isVatReverseChargeApplicable(checkResult)).toBe(false);
    });

    it('should return false when TaxMode is INCLUSIVE and Taxes has entries', () => {
        const checkResult = makeCheckResult({
            TaxMode: TaxMode.INCLUSIVE,
            Taxes: [{ Name: 'VAT', Rate: 20, Amount: 200 }],
        });

        expect(isVatReverseChargeApplicable(checkResult)).toBe(false);
    });
});

describe('createVatReverseChargeItem', () => {
    const createMockCheckResult = (overrides = {}): SubscriptionEstimation => ({
        Amount: 1000,
        AmountDue: 1000,
        Currency: 'USD',
        Cycle: CYCLE.YEARLY,
        TaxMode: TaxMode.EXCLUSIVE,
        Coupon: null,
        SubscriptionMode: SubscriptionMode.Regular,
        BaseRenewAmount: null,
        RenewCycle: null,
        PeriodEnd: +addMonths(new Date(), (overrides as any).Cycle ?? CYCLE.YEARLY) / 1000,
        Taxes: [],
        requestData: {
            Plans: { [PLANS.MAIL]: 1 },
            Currency: 'USD',
            Cycle: CYCLE.YEARLY,
        },
        ...overrides,
    });

    const createMockContext = (checkResult: SubscriptionEstimation, currency: Currency = 'USD') =>
        ({
            checkResult,
            currency,
            isTaxExclusive: checkResult.TaxMode === TaxMode.EXCLUSIVE,
            isTaxInclusive: checkResult.TaxMode === TaxMode.INCLUSIVE,
        }) as HeadlessCheckoutContextInner;

    it('should be visible when TaxMode is REVERSE_CHARGE', () => {
        const checkResult = createMockCheckResult({
            TaxMode: TaxMode.REVERSE_CHARGE,
            Taxes: [],
        });

        const result = createVatReverseChargeItem(createMockContext(checkResult));

        expect(result.visible).toBe(true);
        expect(result.type).toBe('vatReverseCharge');
    });

    it('should not be visible when tax is exclusive', () => {
        const checkResult = createMockCheckResult({
            TaxMode: TaxMode.EXCLUSIVE,
            Taxes: [],
        });

        const result = createVatReverseChargeItem(createMockContext(checkResult));

        expect(result.visible).toBe(false);
    });

    it('should not be visible when tax is exclusive but taxes exist', () => {
        const checkResult = createMockCheckResult({
            TaxMode: TaxMode.EXCLUSIVE,
            Taxes: [{ Name: 'VAT', Rate: 20, Amount: 200 }],
        });

        const result = createVatReverseChargeItem(createMockContext(checkResult));

        expect(result.visible).toBe(false);
    });

    it('should not be visible when tax is inclusive', () => {
        const checkResult = createMockCheckResult({
            TaxMode: TaxMode.INCLUSIVE,
            Taxes: [],
        });

        const result = createVatReverseChargeItem(createMockContext(checkResult));

        expect(result.visible).toBe(false);
    });

    it('should not be visible when tax is inclusive with taxes', () => {
        const checkResult = createMockCheckResult({
            TaxMode: TaxMode.INCLUSIVE,
            Taxes: [{ Name: 'VAT', Rate: 20, Amount: 200 }],
        });

        const result = createVatReverseChargeItem(createMockContext(checkResult));

        expect(result.visible).toBe(false);
    });

    it('should return the correct text', () => {
        const checkResult = createMockCheckResult({
            TaxMode: TaxMode.REVERSE_CHARGE,
            Taxes: [],
        });

        const result = createVatReverseChargeItem(createMockContext(checkResult));

        expect(result.text).toBe('VAT reverse charge mechanism applies.');
    });

    it('returns correct object structure', () => {
        const checkResult = createMockCheckResult();

        const result = createVatReverseChargeItem(createMockContext(checkResult));

        expect(result.type).toBe('vatReverseCharge');
        expect(result).toHaveProperty('text');
        expect(result).toHaveProperty('visible');
    });
});

describe('vatReverseCharge via getHeadlessCheckout', () => {
    it('should be visible when TaxMode is REVERSE_CHARGE', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 4788,
            AmountDue: 4788,
            TaxMode: TaxMode.REVERSE_CHARGE,
            Taxes: [],
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const item = result.getItem('vatReverseCharge');
        expect(item.visible).toBe(true);
        expect(item.text).toBe('VAT reverse charge mechanism applies.');
    });

    it('should not be visible when tax is exclusive with taxes', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 4788,
            AmountDue: 5746,
            TaxMode: TaxMode.EXCLUSIVE,
            Taxes: [{ Name: 'VAT', Rate: 20, Amount: 958 }],
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        expect(result.getItem('vatReverseCharge').visible).toBe(false);
    });

    it('should not be visible when tax is inclusive', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 4788,
            AmountDue: 4788,
            TaxMode: TaxMode.INCLUSIVE,
            Taxes: [{ Name: 'VAT', Rate: 20, Amount: 958 }],
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        expect(result.getItem('vatReverseCharge').visible).toBe(false);
    });
});
