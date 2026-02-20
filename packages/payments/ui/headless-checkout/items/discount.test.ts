import { CYCLE, PLANS } from '../../../core/constants';
import type { PlansMap } from '../../../core/plan/interface';
import { SubscriptionMode } from '../../../core/subscription/constants';
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
        // Monthly price = 499, yearly = 4788 → discount = 20%
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
        expect(discount.discountPercent).toBe(20); // Shows optimistic discount during trial
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
        // Monthly == yearly/12 → no discount
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
            SubscriptionMode: SubscriptionMode.Regular, // Not trial in checkResult
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
            isTrial: true, // Explicitly set as trial
        });

        const discount = result.getItem('discount');
        expect(discount.visible).toBe(true);
        expect(discount.discountPercent).toBe(20); // Shows optimistic discount
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
        expect(discount.visible).toBe(false); // Custom billing still hides discount
    });

    it('should show no discount for trial with monthly plan (no optimistic discount)', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 499, // Monthly amount
            AmountDue: 499,
            Cycle: CYCLE.MONTHLY, // Monthly has no discount
            SubscriptionMode: SubscriptionMode.Trial,
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const discount = result.getItem('discount');
        expect(discount.visible).toBe(false); // No discount for monthly
        expect(discount.discountPercent).toBe(0);
    });

    it('should show no discount when trial checkResult has monthly cycle', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 499, // Monthly amount
            AmountDue: 499,
            Cycle: CYCLE.MONTHLY, // No discount for monthly
            SubscriptionMode: SubscriptionMode.Trial,
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const discount = result.getItem('discount');
        expect(discount.visible).toBe(false); // No discount for monthly cycle
        expect(discount.discountPercent).toBe(0);
    });
});
