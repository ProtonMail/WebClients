import { PLANS } from '../../../core/constants';
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

describe('createProrationItem', () => {
    it('should show proration when isProration and proration != 0', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Proration: -250,
            SubscriptionMode: SubscriptionMode.Regular,
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const proration = result.getItem('proration');
        expect(proration.visible).toBe(true);
        expect(proration.amount).toBe(-250);
        expect(proration.isCredit).toBe(true);
    });

    it('should hide proration when amount is 0', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Proration: 0,
            SubscriptionMode: SubscriptionMode.Regular,
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        expect(result.getItem('proration').visible).toBe(false);
    });

    it('should hide proration for custom billing mode', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Proration: -250,
            SubscriptionMode: SubscriptionMode.CustomBillings,
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        // Proration uses isProration modifier which is false for CustomBillings
        expect(result.getItem('proration').visible).toBe(false);
    });
});
