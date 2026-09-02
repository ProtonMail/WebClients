import { COUPON_CODES, CYCLE, PLANS } from '@proton/payments/core/constants';
import type { PlansMap } from '@proton/payments/core/plan/interface';
import { TaxMode } from '@proton/payments/core/subscription/constants';

import { getHeadlessCheckout } from '../get-headless-checkout';
import { defaultApp as app, makeCheckResult, makePlan, makePricing } from './test-helpers';

const mailPlan = makePlan({
    Name: PLANS.MAIL,
    Title: 'Mail Plus',
    Pricing: makePricing(499, 4788, 8376),
    DefaultPricing: makePricing(499, 4788, 8376),
});

describe('createAmountDueItem', () => {
    it('should have amount-due always visible', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ Amount: 4788, AmountDue: 4788 });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const amountDue = result.getItem('amountDue');
        expect(amountDue.visible).toBe(true);
        expect(amountDue.amountDue).toBe(4788);
    });

    it('should expose the currency from the checkout result', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ Currency: 'EUR' });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        expect(result.getItem('amountDue').currency).toBe('EUR');
    });

    it('should expose the cycle from the checkout result', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ Cycle: CYCLE.MONTHLY });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        expect(result.getItem('amountDue').cycle).toBe(CYCLE.MONTHLY);
    });

    it('should expose the planIDs passed to the checkout', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const planIDs = { [PLANS.MAIL]: 1 };
        const checkResult = makeCheckResult();

        const result = getHeadlessCheckout({ planIDs, plansMap, checkResult, app });

        expect(result.getItem('amountDue').planIDs).toEqual(planIDs);
    });

    it('should expose the planName derived from the selected plan', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult();

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        expect(result.getItem('amountDue').planName).toBe(PLANS.MAIL);
    });

    it('should expose the planTitle derived from the selected plan', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult();

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        expect(result.getItem('amountDue').planTitle).toBe('Mail Plus');
    });

    it('should use "Free" as planTitle when no paid plan is selected', () => {
        const plansMap: PlansMap = {};
        const checkResult = makeCheckResult({ AmountDue: 0 });

        const result = getHeadlessCheckout({
            planIDs: {},
            plansMap,
            checkResult,
            app,
        });

        expect(result.getItem('amountDue').planTitle).toBe('Free');
    });

    describe('label fields', () => {
        it('should show "Amount due" as label when Proration is present', () => {
            const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
            const checkResult = makeCheckResult({ Proration: 100, Cycle: CYCLE.YEARLY });

            const result = getHeadlessCheckout({
                planIDs: { [PLANS.MAIL]: 1 },
                plansMap,
                checkResult,
                app,
            });

            const amountDue = result.getItem('amountDue');
            expect(amountDue.label).toBe('Amount due');
        });

        it('should show "Amount due" as label when Credit is present', () => {
            const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
            const checkResult = makeCheckResult({ Credit: 100, Cycle: CYCLE.YEARLY });

            const result = getHeadlessCheckout({
                planIDs: { [PLANS.MAIL]: 1 },
                plansMap,
                checkResult,
                app,
            });

            const amountDue = result.getItem('amountDue');
            expect(amountDue.label).toBe('Amount due');
        });

        it('should show "Amount due" as label when CouponDiscount is present', () => {
            const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
            const checkResult = makeCheckResult({ CouponDiscount: 100, Cycle: CYCLE.YEARLY });

            const result = getHeadlessCheckout({
                planIDs: { [PLANS.MAIL]: 1 },
                plansMap,
                checkResult,
                app,
            });

            const amountDue = result.getItem('amountDue');
            expect(amountDue.label).toBe('Amount due');
        });

        it('should show "Amount due" as label when isTrial is true', () => {
            const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
            const checkResult = makeCheckResult({
                Cycle: CYCLE.YEARLY,
                TaxMode: TaxMode.EXCLUSIVE,
                Taxes: [{ Name: 'VAT', Rate: 20, Amount: 958 }],
            });

            const result = getHeadlessCheckout({
                planIDs: { [PLANS.MAIL]: 1 },
                plansMap,
                checkResult,
                app,
                isTrial: true,
            });

            const amountDue = result.getItem('amountDue');
            expect(amountDue.label).toBe('Amount due now');
        });

        it('should show "Amount due" as label when couponConfig.hidden is true', () => {
            const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
            const checkResult = makeCheckResult({
                Cycle: CYCLE.YEARLY,
                TaxMode: TaxMode.EXCLUSIVE,
                Taxes: [{ Name: 'VAT', Rate: 20, Amount: 958 }],
            });

            const result = getHeadlessCheckout({
                planIDs: { [PLANS.MAIL]: 1 },
                plansMap,
                checkResult,
                app,
                couponConfig: { hidden: true },
            });

            const amountDue = result.getItem('amountDue');
            expect(amountDue.label).toBe('Amount due');
        });

        it('should show "Amount due" as label for a non-BF coupon with a non-zero CouponDiscount', () => {
            const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
            const checkResult = makeCheckResult({
                Cycle: CYCLE.YEARLY,
                Coupon: {
                    Code: 'REGULAR',
                    Description: 'regular promo',
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

            const amountDue = result.getItem('amountDue');
            expect(amountDue.label).toBe('Amount due');
        });

        it('should prefer "Amount due" label when a BF offer also carries proration', () => {
            const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
            const checkResult = makeCheckResult({
                Cycle: CYCLE.YEARLY,
                Proration: 100,
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

            const amountDue = result.getItem('amountDue');
            expect(amountDue.label).toBe('Amount due');
        });

        it('should prioritize "Amount due" label over "Total" when both conditions exist', () => {
            const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
            const checkResult = makeCheckResult({
                Proration: 100,
                Cycle: CYCLE.YEARLY,
                TaxMode: TaxMode.EXCLUSIVE,
                Taxes: [{ Name: 'VAT', Rate: 20, Amount: 958 }],
            });

            const result = getHeadlessCheckout({
                planIDs: { [PLANS.MAIL]: 1 },
                plansMap,
                checkResult,
                app,
            });

            const amountDue = result.getItem('amountDue');
            expect(amountDue.labelTotalAmount).toBe('Total for 12 months');
            expect(amountDue.label).toBe('Amount due');
        });
    });
});
