import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import type { PlansMap } from '@proton/payments/core/plan/interface';
import { SubscriptionMode } from '@proton/payments/core/subscription/constants';

import { getHeadlessCheckout } from '../get-headless-checkout';
import { defaultApp as app, makeCheckResult, makePlan, makePricing } from './test-helpers';

const mailPlan = makePlan({
    Name: PLANS.MAIL,
    Title: 'Mail Plus',
    Pricing: makePricing(499, 4788, 8376),
    DefaultPricing: makePricing(499, 4788, 8376),
});

const lifetimePlan = makePlan({
    Name: PLANS.PASS_LIFETIME,
    Title: 'Pass Lifetime',
    Pricing: makePricing(19900),
    DefaultPricing: makePricing(19900),
});

describe('createPlanAmountItem', () => {
    it('should have plan-amount item visible for paid plan', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ Amount: 4788, AmountDue: 4788 });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const planAmount = result.getItem('planAmount');
        expect(planAmount.visible).toBe(true);
        expect(planAmount.amount).toBe(4788);
        expect(planAmount.label).toContain('12');
    });

    it('should use optimistic amount for plan-amount when trial with Amount=0', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 0,
            AmountDue: 0,
            SubscriptionMode: SubscriptionMode.Trial,
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const planAmount = result.getItem('planAmount');
        expect(planAmount.amount).toBe(4788);
    });

    it('should use "Total" label for lifetime plan-amount', () => {
        const plansMap: PlansMap = { [PLANS.PASS_LIFETIME]: lifetimePlan };
        const checkResult = makeCheckResult({
            Amount: 19900,
            AmountDue: 19900,
            Cycle: CYCLE.MONTHLY,
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.PASS_LIFETIME]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const planAmount = result.getItem('planAmount');
        expect(planAmount.label).toBe('Total');
    });

    it('should hide members and plan-amount for free plan', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ Amount: 0, AmountDue: 0 });

        const result = getHeadlessCheckout({
            planIDs: {},
            plansMap,
            checkResult,
            app,
        });

        expect(result.getItem('members').visible).toBe(false);
        expect(result.getItem('planAmount').visible).toBe(false);
    });

    it('should use discounted amount for plan-amount when couponConfig.hidden is true', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ Amount: 4788, AmountDue: 3788, CouponDiscount: -1000 });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            couponConfig: { hidden: true },
            app,
        });

        expect(result.getItem('planAmount').amount).toBe(3788);
    });

    it('should use discounted amount for plan-amount on a Black Friday offer', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 4788,
            AmountDue: 3788,
            CouponDiscount: -1000,
            Coupon: {
                Code: COUPON_CODES.BLACK_FRIDAY_2025,
                Description: 'BF promo',
                MaximumRedemptionsPerUser: null,
            },
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        expect(result.getItem('planAmount').amount).toBe(3788);
    });

    it('should keep the full amount for plan-amount on a non-BF coupon with a discount', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 4788,
            AmountDue: 3788,
            CouponDiscount: -1000,
            Coupon: {
                Code: 'REGULAR',
                Description: 'regular promo',
                MaximumRedemptionsPerUser: null,
            },
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        expect(result.getItem('planAmount').amount).toBe(4788);
    });
});
