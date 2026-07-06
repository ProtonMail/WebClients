import type { FreeSubscription, PlanIDs } from '@proton/payments/core/interface';
import { getPlanNameFromIDs } from '@proton/payments/core/plan/helpers';
import { getPlanName } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';

export function isSamePlanCheckout(
    subscription: Subscription | FreeSubscription | undefined,
    planIDs: PlanIDs
): boolean {
    const currentPlanName = getPlanName(subscription);
    const newPlanName = getPlanNameFromIDs(planIDs);
    return currentPlanName === newPlanName;
}

export function isSamePlan(
    subscriptionLeft: Subscription | FreeSubscription,
    subscriptionRight: Subscription | FreeSubscription | undefined
): boolean {
    return getPlanName(subscriptionLeft) === getPlanName(subscriptionRight);
}
