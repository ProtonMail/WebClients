import type { FreeSubscription, PLANS } from '@proton/shared/lib/constants';
import { CYCLE } from '@proton/shared/lib/constants';
import { getPlanName } from '@proton/shared/lib/helpers/subscription';
import type { Cycle, PlanIDs, SubscriptionModel } from '@proton/shared/lib/interfaces';

/**
 * Excludes 24 months cycle for the specified plans
 */
export function exclude24Months(
    planIDs: PlanIDs,
    subscription: SubscriptionModel | FreeSubscription,
    plansWithout24Months: PLANS[]
): Cycle[] | undefined {
    const selectedPlanWithout24Months = plansWithout24Months.find((plan) => planIDs[plan]);
    // if the selected plan doesn't need to exclude 24 months cycle, return undefined,
    //  which means that we won't override the cycles
    if (!selectedPlanWithout24Months) {
        return;
    }

    const userHasSamePlanWith24Months =
        getPlanName(subscription) === selectedPlanWithout24Months && subscription.Cycle === CYCLE.TWO_YEARS;
    // if the plan must not have 24 months cycle but user already has one then we don't need to exclude 24 months cycle
    if (userHasSamePlanWith24Months) {
        return;
    }

    return [CYCLE.YEARLY, CYCLE.MONTHLY];
}
