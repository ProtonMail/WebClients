import { PLANS } from '@proton/payments/core/constants';
import { SubscriptionMode } from '@proton/payments/core/subscription/constants';

import { createHeadlessCheckoutContextInner } from './get-headless-checkout';
import { defaultApp as app, makeCheckResult, makePlan, makePricing } from './items/test-helpers';
import { computePlanAmount } from './plan-amount-helpers';

const mailPlan = makePlan({
    Name: PLANS.MAIL,
    Title: 'Mail Plus',
    Pricing: makePricing(499, 4788, 8376),
    DefaultPricing: makePricing(499, 4788, 8376),
});

const makeContext = (checkResult: any, couponConfig?: { hidden?: boolean }) =>
    createHeadlessCheckoutContextInner({
        planIDs: { [PLANS.MAIL]: 1 },
        plansMap: { [PLANS.MAIL]: mailPlan },
        checkResult,
        couponConfig,
        app,
    });

describe('computePlanAmount', () => {
    it('should return the full Amount when no hidden/invisible coupon is applied', () => {
        const ctx = makeContext(makeCheckResult({ Amount: 999, AmountDue: 990 }));
        expect(computePlanAmount(ctx)).toBe(999);
    });

    it('should return withDiscountPerCycle when couponConfig.hidden is true', () => {
        const ctx = makeContext(makeCheckResult({ Amount: 998, AmountDue: 898, CouponDiscount: -100 }), {
            hidden: true,
        });
        expect(computePlanAmount(ctx)).toBe(898);
    });

    it('should return withDiscountPerCycle for a Black Friday 2025 offer', () => {
        const ctx = makeContext(
            makeCheckResult({
                Amount: 997,
                AmountDue: 897,
                CouponDiscount: -100,
                Coupon: { Code: 'BF25PROMO', Description: 'BF', MaximumRedemptionsPerUser: null },
            })
        );
        expect(computePlanAmount(ctx)).toBe(897);
    });

    it('should return the full Amount for a non-BF visible coupon', () => {
        const ctx = makeContext(
            makeCheckResult({
                Amount: 886,
                AmountDue: 796,
                CouponDiscount: -90,
                Coupon: { Code: 'REGULAR', Description: 'promo', MaximumRedemptionsPerUser: null },
            })
        );
        expect(computePlanAmount(ctx)).toBe(886);
    });

    it('should return optimistic amount when trial with Amount=0', () => {
        const ctx = makeContext(makeCheckResult({ Amount: 0, AmountDue: 0, SubscriptionMode: SubscriptionMode.Trial }));
        expect(computePlanAmount(ctx)).toBe(4788);
    });
});
