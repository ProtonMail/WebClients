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

describe('createUnusedCreditItem', () => {
    it('should show unused-credit for custom billing with negative value', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            UnusedCredit: -500,
            SubscriptionMode: SubscriptionMode.CustomBillings,
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const unusedCredit = result.getItem('unusedCredit');
        expect(unusedCredit.visible).toBe(true);
        expect(unusedCredit.amount).toBe(-500);
    });

    it('should hide unused-credit for non-custom billing', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            UnusedCredit: -500,
            SubscriptionMode: SubscriptionMode.Regular,
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        expect(result.getItem('unusedCredit').visible).toBe(false);
    });
});
