import type { FreeSubscription } from '@proton/payments/core/interface';
import { getIsVpnPlan } from '@proton/payments/core/plan/helpers';
import type { PlansMap } from '@proton/payments/core/plan/interface';
import type { Subscription, SubscriptionCheckForbiddenReason } from '@proton/payments/core/subscription/interface';
import { SelectedPlan } from '@proton/payments/core/subscription/selected-plan';

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
