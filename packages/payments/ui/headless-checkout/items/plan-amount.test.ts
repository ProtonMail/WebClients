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
        // When Amount is 0 and trial, net total falls back to optimistic (plan pricing for cycle)
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
});
