import { CYCLE, PLANS } from '@proton/payments/core/constants';
import type { PlansMap } from '@proton/payments/core/plan/interface';

import { getHeadlessCheckout } from '../get-headless-checkout';
import { defaultApp as app, makeCheckResult, makePlan, makePricing } from './test-helpers';

const mailPlan = makePlan({
    Name: PLANS.MAIL,
    Title: 'Mail Plus',
    Pricing: makePricing(499, 4788, 8376),
    DefaultPricing: makePricing(499, 4788, 8376),
});

describe('createPlanAmountWithDiscountPerMonthItem', () => {
    it('should expose the plan-amount-with-discount-per-month line item type', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult();

        const result = getHeadlessCheckout({ planIDs: { [PLANS.MAIL]: 1 }, plansMap, checkResult, app });

        expect(result.getItem('planAmountWithDiscountPerMonth').type).toBe('planAmountWithDiscountPerMonth');
    });

    it('should expose the net amount per month (withDiscountPerMonth) from the checkout UI', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ Amount: 5000, AmountDue: 4600, Cycle: CYCLE.YEARLY });

        const result = getHeadlessCheckout({ planIDs: { [PLANS.MAIL]: 1 }, plansMap, checkResult, app });

        const item = result.getItem('planAmountWithDiscountPerMonth');
        expect(item.planAmountWithDiscountPerMonth).toBe(result.checkoutUi.withDiscountPerMonth);
    });

    it('should expose the currency from the checkout result', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ Currency: 'EUR' });

        const result = getHeadlessCheckout({ planIDs: { [PLANS.MAIL]: 1 }, plansMap, checkResult, app });

        expect(result.getItem('planAmountWithDiscountPerMonth').currency).toBe('EUR');
    });

    it('should be visible for a paid plan', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult();

        const result = getHeadlessCheckout({ planIDs: { [PLANS.MAIL]: 1 }, plansMap, checkResult, app });

        expect(result.getItem('planAmountWithDiscountPerMonth').visible).toBe(true);
    });

    it('should be hidden for a free plan', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ Amount: 0, AmountDue: 0 });

        const result = getHeadlessCheckout({ planIDs: {}, plansMap, checkResult, app });

        expect(result.getItem('planAmountWithDiscountPerMonth').visible).toBe(false);
    });
});
