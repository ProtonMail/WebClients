import type { FreeSubscription, PlanIDs } from '@proton/payments/core/interface';
import { getPlanName } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { getPlanNameFromIDs } from '@proton/shared/lib/payments/plan/helpers';

export function isSamePlanCheckout(
    subscription: Subscription | FreeSubscription | undefined,
    planIDs: PlanIDs
): boolean {
    const currentPlanName = getPlanName(subscription);
    const newPlanName = getPlanNameFromIDs(planIDs);
    return currentPlanName === newPlanName;
}
