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

describe('createCreditItem', () => {
    it('should show credit when non-zero', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ Credit: -300 });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const credit = result.getItem('credit');
        expect(credit.visible).toBe(true);
        expect(credit.amount).toBe(-300);
        expect(credit.isAddedToBalance).toBe(false);
    });

    it('should mark credit as added to balance when positive', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({ Credit: 500 });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const credit = result.getItem('credit');
        expect(credit.visible).toBe(true);
        expect(credit.isAddedToBalance).toBe(true);
    });
});
