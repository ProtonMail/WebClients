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

describe('createDiscountItem', () => {
    it('should show discount when discountPercent is non-zero and not trial/custom-billing', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ Amount: 4788, AmountDue: 4788, Cycle: CYCLE.YEARLY });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const discount = result.getItem('discount');
        expect(discount.visible).toBe(true);
        expect(discount.discountPercent).toBe(20);
    });

    it('should show optimistic discount for trial', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 0,
            AmountDue: 0,
            Cycle: CYCLE.YEARLY,
            SubscriptionMode: SubscriptionMode.Trial,
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const discount = result.getItem('discount');
        expect(discount.visible).toBe(true);
        expect(discount.discountPercent).toBe(20);
    });

    it('should hide discount for custom billing', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 4788,
            AmountDue: 4788,
            Cycle: CYCLE.YEARLY,
            SubscriptionMode: SubscriptionMode.CustomBillings,
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const discount = result.getItem('discount');
        expect(discount.visible).toBe(false);
    });

    it('should hide discount when discountPercent is 0', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ Amount: 499, AmountDue: 499, Cycle: CYCLE.MONTHLY });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const discount = result.getItem('discount');
        expect(discount.visible).toBe(false);
        expect(discount.discountPercent).toBe(0);
    });

    it('should show optimistic discount for trial with explicit isTrial parameter', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 0,
            AmountDue: 0,
            Cycle: CYCLE.YEARLY,
            SubscriptionMode: SubscriptionMode.Regular,
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
            isTrial: true,
        });

        const discount = result.getItem('discount');
        expect(discount.visible).toBe(true);
        expect(discount.discountPercent).toBe(20);
    });

    it('should hide discount for trial with custom billing', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 0,
            AmountDue: 0,
            Cycle: CYCLE.YEARLY,
            SubscriptionMode: SubscriptionMode.CustomBillings,
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const discount = result.getItem('discount');
        expect(discount.visible).toBe(false);
    });

    it('should show no discount for trial with monthly plan (no optimistic discount)', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 499,
            AmountDue: 499,
            Cycle: CYCLE.MONTHLY,
            SubscriptionMode: SubscriptionMode.Trial,
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const discount = result.getItem('discount');
        expect(discount.visible).toBe(false);
        expect(discount.discountPercent).toBe(0);
    });

    it('should show no discount when trial checkResult has monthly cycle', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 499,
            AmountDue: 499,
            Cycle: CYCLE.MONTHLY,
            SubscriptionMode: SubscriptionMode.Trial,
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const discount = result.getItem('discount');
        expect(discount.visible).toBe(false);
        expect(discount.discountPercent).toBe(0);
    });

    it('should hide not discount % when couponConfig.hidden is true', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ Amount: 4788, AmountDue: 4588, Cycle: CYCLE.YEARLY });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            couponConfig: { hidden: true },
            app,
        });

        expect(result.getItem('discount').visible).toBe(true);
    });

    it('should not hide discount % for a Black Friday 2025 offer', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 4788,
            AmountDue: 4488,
            Cycle: CYCLE.YEARLY,
            Coupon: {
                Code: COUPON_CODES.BLACK_FRIDAY_2025,
                Description: 'BF promo',
                MaximumRedemptionsPerUser: null,
            },
            CouponDiscount: -300,
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const discount = result.getItem('discount');
        expect(discount.discountPercent).toBeGreaterThan(0);
        expect(discount.visible).toBe(true);
    });
});
