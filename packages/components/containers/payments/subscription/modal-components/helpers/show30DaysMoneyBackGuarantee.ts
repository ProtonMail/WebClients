import {
    type FreeSubscription,
    type PlansMap,
    SelectedPlan,
    type Subscription,
    type SubscriptionCheckForbiddenReason,
    getIsVpnPlan,
} from '@proton/payments/index';

export function show30DaysMoneyBackGuarantee({
    plansMap,
    subscription,
    paymentForbiddenReason,
    selectedPlan,
}: {
    paymentForbiddenReason: SubscriptionCheckForbiddenReason;
    plansMap: PlansMap;
    subscription: Subscription | FreeSubscription | undefined;
    selectedPlan: SelectedPlan;
}): boolean {
    const currentPlan = SelectedPlan.createFromSubscription(subscription, plansMap);

    const addonsModification =
        selectedPlan.getPlanName() === currentPlan.getPlanName() && !selectedPlan.isEqualTo(currentPlan);
    const hasGuarantee =
        getIsVpnPlan(selectedPlan.getPlanName()) && !addonsModification && !paymentForbiddenReason.forbidden;
    return hasGuarantee;
}
