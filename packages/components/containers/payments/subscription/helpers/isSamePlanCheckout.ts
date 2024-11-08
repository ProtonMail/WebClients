import { type FreeSubscription, type PlanIDs } from '@proton/payments';
import { getPlanNameFromIDs } from '@proton/shared/lib/helpers/planIDs';
import { getPlanName } from '@proton/shared/lib/helpers/subscription';
import { type Subscription } from '@proton/shared/lib/interfaces';

export function isSamePlanCheckout(
    subscription: Subscription | FreeSubscription | undefined,
    planIDs: PlanIDs
): boolean {
    const currentPlanName = getPlanName(subscription);
    const newPlanName = getPlanNameFromIDs(planIDs);
    return currentPlanName === newPlanName;
}
