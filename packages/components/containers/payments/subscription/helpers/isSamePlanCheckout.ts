import {
    type FreeSubscription,
    type PlanIDs,
    type Subscription,
    getPlanName,
    getPlanNameFromIDs,
} from '@proton/payments';

export function isSamePlanCheckout(
    subscription: Subscription | FreeSubscription | undefined,
    planIDs: PlanIDs
): boolean {
    const currentPlanName = getPlanName(subscription);
    const newPlanName = getPlanNameFromIDs(planIDs);
    return currentPlanName === newPlanName;
}
