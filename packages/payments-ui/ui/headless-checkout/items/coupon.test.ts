import { COUPON_CODES, PLANS } from '@proton/payments/core/constants';
import type { PlansMap } from '@proton/payments/core/plan/interface';

import { getHeadlessCheckout } from '../get-headless-checkout';
import { defaultApp as app, makeCheckResult, makePlan, makePricing } from './test-helpers';

const mailPlan = makePlan({
    Name: PLANS.MAIL,
    Title: 'Mail Plus',
    Pricing: makePricing(499, 4788, 8376),
    DefaultPricing: makePricing(499, 4788, 8376),
});

describe('createCouponItem', () => {
    it('should show coupon when CouponDiscount is non-zero', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 4788,
            AmountDue: 3788,
            CouponDiscount: -1000,
            Coupon: {
                Code: 'SAVE20',
                Description: '20% off',
                MaximumRedemptionsPerUser: null,
            },
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const coupon = result.getItem('coupon');
        expect(coupon.visible).toBe(true);
        expect(coupon.couponCode).toBe('SAVE20');
        expect(coupon.couponDescription).toBe('20% off');
        expect(coupon.discountAmount).toBe(-1000);
    });

    it('should hide coupon when CouponDiscount is 0', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ CouponDiscount: 0 });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        expect(result.getItem('coupon').visible).toBe(false);
    });

    it('should handle hidden coupon config for net total computation', () => {
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

        const planAmount = result.getItem('planAmount');
        expect(planAmount.amount).toBe(3788);
    });

    it('should hide coupon when couponConfig.hidden is true', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 4788,
            AmountDue: 3788,
            CouponDiscount: -1000,
            Coupon: {
                Code: 'HIDDEN',
                Description: 'hidden coupon',
                MaximumRedemptionsPerUser: null,
            },
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            couponConfig: { hidden: true },
            app,
        });

        const coupon = result.getItem('coupon');
        expect(coupon.visible).toBe(false);
        expect(coupon.discountAmount).toBe(-1000);
    });

    it('should hide coupon for a Black Friday 2025 offer with a non-zero discount', () => {
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

        const coupon = result.getItem('coupon');
        expect(coupon.visible).toBe(false);
        expect(coupon.couponCode).toBe(COUPON_CODES.BLACK_FRIDAY_2025);
        expect(coupon.discountAmount).toBe(-1000);
    });

    it('should show coupon for a non-BF coupon with a non-zero discount and no hidden config', () => {
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

        expect(result.getItem('coupon').visible).toBe(true);
    });
});
