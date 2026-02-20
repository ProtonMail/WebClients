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

function getBillingCycleItem(cycle: CYCLE) {
    const plansMap: PlansMap = { [PLANS.MAIL]: mailPlan };
    const checkResult = makeCheckResult({ Cycle: cycle });

    const result = getHeadlessCheckout({
        planIDs: { [PLANS.MAIL]: 1 },
        plansMap,
        checkResult,
        app,
    });

    return result.getItem('billingCycle');
}

describe('createBillingCycleItem', () => {
    it('should have type billingCycle', () => {
        const item = getBillingCycleItem(CYCLE.YEARLY);
        expect(item.type).toBe('billingCycle');
    });

    it('should always be visible', () => {
        expect(getBillingCycleItem(CYCLE.MONTHLY).visible).toBe(true);
        expect(getBillingCycleItem(CYCLE.YEARLY).visible).toBe(true);
        expect(getBillingCycleItem(CYCLE.TWO_YEARS).visible).toBe(true);
    });

    it('should expose the cycle value', () => {
        expect(getBillingCycleItem(CYCLE.MONTHLY).cycle).toBe(CYCLE.MONTHLY);
        expect(getBillingCycleItem(CYCLE.YEARLY).cycle).toBe(CYCLE.YEARLY);
        expect(getBillingCycleItem(CYCLE.TWO_YEARS).cycle).toBe(CYCLE.TWO_YEARS);
    });

    describe('shortText', () => {
        it('should return "Monthly" for CYCLE.MONTHLY', () => {
            expect(getBillingCycleItem(CYCLE.MONTHLY).shortText).toBe('Monthly');
        });

        it('should return "Yearly" for CYCLE.YEARLY', () => {
            expect(getBillingCycleItem(CYCLE.YEARLY).shortText).toBe('Yearly');
        });

        it('should return "N months" for other cycles', () => {
            expect(getBillingCycleItem(CYCLE.TWO_YEARS).shortText).toBe('24 months');
            expect(getBillingCycleItem(CYCLE.FIFTEEN).shortText).toBe('15 months');
            expect(getBillingCycleItem(CYCLE.THREE).shortText).toBe('3 months');
        });
    });

    describe('normalText', () => {
        it('should return "Billed monthly" for CYCLE.MONTHLY', () => {
            expect(getBillingCycleItem(CYCLE.MONTHLY).normalText).toBe('Billed monthly');
        });

        it('should return "1 year" for CYCLE.YEARLY', () => {
            expect(getBillingCycleItem(CYCLE.YEARLY).normalText).toBe('1 year');
        });

        it('should return "2 years" for CYCLE.TWO_YEARS', () => {
            expect(getBillingCycleItem(CYCLE.TWO_YEARS).normalText).toBe('2 years');
        });

        it('should return "N months" for other cycles', () => {
            expect(getBillingCycleItem(CYCLE.FIFTEEN).normalText).toBe('15 months');
            expect(getBillingCycleItem(CYCLE.THREE).normalText).toBe('3 months');
        });
    });
});
