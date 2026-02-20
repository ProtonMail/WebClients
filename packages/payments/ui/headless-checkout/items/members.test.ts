import { PLANS } from '../../../core/constants';
import type { PlansMap } from '../../../core/plan/interface';
import { getHeadlessCheckout } from '../get-headless-checkout';
import { defaultApp as app, makeCheckResult, makePlan, makePricing } from './test-helpers';

const mailPlan = makePlan({
    Name: PLANS.MAIL,
    Title: 'Mail Plus',
    Pricing: makePricing(499, 4788, 8376),
    DefaultPricing: makePricing(499, 4788, 8376),
});

describe('createMembersItem', () => {
    it('should have members item visible', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ Amount: 4788, AmountDue: 4788 });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const members = result.getItem('members');
        expect(members.visible).toBe(true);
        expect(members.labelWithQuantity).toContain('user');
    });

    it('should use withDiscountMembersPerMonth when discountTarget is base-users', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 4788,
            AmountDue: 3788,
            CouponDiscount: -1000,
            Coupon: {
                Code: 'PLAN_ONLY',
                Description: 'discount',
                MaximumRedemptionsPerUser: null,
                // Targets only the plan (not addons) — triggers discountTarget = 'base-users'
                Targets: { [PLANS.MAIL]: 1 } as any,
            },
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const members = result.getItem('members');
        // withDiscountMembersPerMonth = membersPerMonth - couponDiscount/cycle
        expect(members.pricePerAllPerMonth).toBe(result.checkoutUi.withDiscountMembersPerMonth);
    });

    it('should use withDiscountPerMonth when coupon is hidden and no addons', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 4788,
            AmountDue: 3788,
            CouponDiscount: -1000,
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            couponConfig: { hidden: true },
            app,
        });

        const members = result.getItem('members');
        // No addons + couponConfig.hidden → uses withDiscountPerMonth
        expect(members.pricePerAllPerMonth).toBe(result.checkoutUi.withDiscountPerMonth);
    });

    it('should use membersPerMonth by default', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ Amount: 4788, AmountDue: 4788 });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const members = result.getItem('members');
        expect(members.pricePerAllPerMonth).toBe(result.checkoutUi.membersPerMonth);
    });
});
