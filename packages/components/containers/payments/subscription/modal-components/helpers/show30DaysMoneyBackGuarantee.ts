import {
    type FreeSubscription,
    type PlanIDs,
    type PlansMap,
    SelectedPlan,
    type Subscription,
    type SubscriptionCheckForbiddenReason,
    getIsVpnPlan,
    getPlanNameFromIDs,
} from '@proton/payments/index';

export function show30DaysMoneyBackGuarantee({
    planIDs,
    plansMap,
    subscription,
    paymentForbiddenReason,
    selectedPlan,
}: {
    planIDs: PlanIDs;
    paymentForbiddenReason: SubscriptionCheckForbiddenReason;
    plansMap: PlansMap;
    subscription: Subscription | FreeSubscription | undefined;
    selectedPlan: SelectedPlan;
}): boolean {
    const planName = getPlanNameFromIDs(planIDs);

    const currentPlan = SelectedPlan.createFromSubscription(subscription, plansMap);

    const addonsModification =
        selectedPlan.getPlanName() === currentPlan.getPlanName() && !selectedPlan.isEqualTo(currentPlan);
    const hasGuarantee = getIsVpnPlan(planName) && !addonsModification && !paymentForbiddenReason.forbidden;
    return hasGuarantee;
}
