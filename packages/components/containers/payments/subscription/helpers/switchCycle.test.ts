import { CYCLE, FREE_SUBSCRIPTION, PLANS } from '@proton/payments/core/constants';
import { getDefaultMainCurrency } from '@proton/payments/core/currencies';
import type { PlanIDs } from '@proton/payments/core/interface';
import type { FullPlansMap } from '@proton/payments/core/subscription/interface';
import { getPlansMap } from '@proton/payments/core/subscription/plans-map-wrapper';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { getLongTestPlans } from '@proton/payments/testing/data-plans';

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

    it('returns MONTHLY when preferred on same-plan subscription with a higher cycle', () => {
        const planIDs: PlanIDs = { [PLANS.MAIL]: 1 };
        const subscription = buildSubscription({ planName: PLANS.MAIL, cycle: CYCLE.TWO_YEARS, currency });

        const result = switchCycle({
            preferredCycle: CYCLE.MONTHLY,
            selectedPlanIDs: planIDs,
            currency,
            subscription,
            plansMap,
        });

        expect(result).toBe(CYCLE.MONTHLY);
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
