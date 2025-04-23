import { type FreeSubscription, type PlanIDs, type Subscription, getPlanNameFromIDs } from '@proton/payments';
import { getPlanName } from '@proton/payments';

export function isSamePlanCheckout(
    subscription: Subscription | FreeSubscription | undefined,
    planIDs: PlanIDs
): boolean {
    const currentPlanName = getPlanName(subscription);
    const newPlanName = getPlanNameFromIDs(planIDs);
    return currentPlanName === newPlanName;
}
