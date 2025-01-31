import { type CYCLE, type PlanIDs } from '@proton/payments';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import { getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import type { Subscription } from '@proton/shared/lib/interfaces';

export function isSubscriptionUnchanged(
    subscription: Subscription | null | undefined,
    planIds: PlanIDs,
    cycle?: CYCLE
): boolean {
    const subscriptionPlanIds = getPlanIDs(subscription);

    const planIdsUnchanged = isDeepEqual(subscriptionPlanIds, planIds);
    // Cycle is optional, so if it is not provided, we assume it is unchanged
    const cycleUnchanged =
        !cycle || cycle === subscription?.Cycle || cycle === subscription?.UpcomingSubscription?.Cycle;

    return planIdsUnchanged && cycleUnchanged;
}
