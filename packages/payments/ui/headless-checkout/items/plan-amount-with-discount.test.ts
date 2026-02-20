import { PLANS } from '../../../core/constants';
import type { PlansMap } from '../../../core/plan/interface';
import { TaxInclusive } from '../../../core/subscription/constants';
import { getHeadlessCheckout } from '../get-headless-checkout';
import { defaultApp as app, makeCheckResult, makePlan, makePricing } from './test-helpers';

const mailPlan = makePlan({
    Name: PLANS.MAIL,
    Title: 'Mail Plus',
    Pricing: makePricing(499, 4788, 8376),
    DefaultPricing: makePricing(499, 4788, 8376),
});

describe('createNetAmountItem', () => {
    it('should show net-amount and tax-exclusive items when tax is exclusive', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 4788,
            AmountDue: 5746,
            TaxInclusive: TaxInclusive.EXCLUSIVE,
            Taxes: [{ Name: 'VAT', Rate: 20, Amount: 958 }],
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        const netAmount = result.getItem('planAmountWithDiscount');
        expect(netAmount.visible).toBe(true);
    });

    it('should hide net-amount and tax-exclusive when tax is inclusive', () => {
        const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
        const checkResult = makeCheckResult({
            Amount: 4788,
            AmountDue: 4788,
            TaxInclusive: TaxInclusive.INCLUSIVE,
            Taxes: [{ Name: 'VAT', Rate: 20, Amount: 958 }],
        });

        const result = getHeadlessCheckout({
            planIDs: { [PLANS.MAIL]: 1 },
            plansMap,
            checkResult,
            app,
        });

        expect(result.getItem('planAmountWithDiscount').visible).toBe(false);
    });
});
