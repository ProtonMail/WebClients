import {
    CYCLE,
    FREE_SUBSCRIPTION,
    type FullPlansMap,
    PLANS,
    type PlanIDs,
    getDefaultMainCurrency,
    getPlansMap,
} from '@proton/payments';
import { buildSubscription } from '@proton/testing/builders';
import { getLongTestPlans } from '@proton/testing/data';

import { switchCycle } from './switchCycle';

describe('switchCycle', () => {
    const currency = getDefaultMainCurrency();
    let plansMap: FullPlansMap;

    beforeEach(() => {
        plansMap = getPlansMap(getLongTestPlans(), currency, false);
    });

    it('returns the preferred cycle when it is allowed', () => {
        const planIDs: PlanIDs = { [PLANS.MAIL]: 1 };

        const result = switchCycle({
            preferredCycle: CYCLE.YEARLY,
            selectedPlanIDs: planIDs,
            currency,
            subscription: FREE_SUBSCRIPTION,
            plansMap,
        });

        expect(result).toBe(CYCLE.YEARLY);
    });

    it('returns the first allowed cycle when the preferred cycle is not allowed', () => {
        // BUNDLE_PRO_2024 is capped at YEARLY by default rules, so TWO_YEARS is not allowed
        const planIDs: PlanIDs = { [PLANS.BUNDLE_PRO_2024]: 1 };

        const result = switchCycle({
            preferredCycle: CYCLE.TWO_YEARS,
            selectedPlanIDs: planIDs,
            currency,
            subscription: FREE_SUBSCRIPTION,
            plansMap,
        });

        expect(result).toBe(CYCLE.YEARLY);
    });

    it('returns MONTHLY when preferred and subscription is on a different plan', () => {
        const planIDs: PlanIDs = { [PLANS.MAIL]: 1 };

        // Different plan from subscription → isSamePlan is false → all cycles are eligible
        const subscription = buildSubscription({ planName: PLANS.BUNDLE, cycle: CYCLE.YEARLY, currency });

        const result = switchCycle({
            preferredCycle: CYCLE.MONTHLY,
            selectedPlanIDs: planIDs,
            currency,
            subscription,
            plansMap,
        });

        expect(result).toBe(CYCLE.MONTHLY);
    });

    it('returns first allowed cycle (TWO_YEARS) when preferred cycle is MONTHLY but same-plan subscription blocks it', () => {
        // Same plan checkout on a 24-month subscription: only cycles >= 24 are eligible
        const planIDs: PlanIDs = { [PLANS.MAIL]: 1 };
        const subscription = buildSubscription({ planName: PLANS.MAIL, cycle: CYCLE.TWO_YEARS, currency });

        const result = switchCycle({
            preferredCycle: CYCLE.MONTHLY,
            selectedPlanIDs: planIDs,
            currency,
            subscription,
            plansMap,
        });

        expect(result).toBe(CYCLE.TWO_YEARS);
    });

    it('returns undefined when no plan is found in plansMap (empty allowedCycles)', () => {
        const planIDs: PlanIDs = { [PLANS.MAIL]: 1 };

        const result = switchCycle({
            preferredCycle: CYCLE.YEARLY,
            selectedPlanIDs: planIDs,
            currency,
            subscription: FREE_SUBSCRIPTION,
            plansMap: {} as FullPlansMap,
        });

        expect(result).toBeUndefined();
    });
});
