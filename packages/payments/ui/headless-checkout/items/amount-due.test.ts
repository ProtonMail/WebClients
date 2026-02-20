import { CYCLE, PLANS } from '../../../core/constants';
import type { PlansMap } from '../../../core/plan/interface';
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
});
