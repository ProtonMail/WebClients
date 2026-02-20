import type { getOptimisticCheckResult } from './checkout';
import type { FreeSubscription } from './interface';
import { planIDsPositiveDifference } from './planIDs';
import { SubscriptionMode } from './subscription/constants';
import type { Subscription } from './subscription/interface';
import { SelectedPlan } from './subscription/selected-plan';
import { isFreeSubscription } from './type-guards';

export function computeOptimisticSubscriptionMode(
    { planIDs, cycle, currency, plansMap }: Parameters<typeof getOptimisticCheckResult>[0],
    subscription: Subscription | FreeSubscription | undefined,
    {
        isTrial,
    }: {
        isTrial?: boolean;
    } = {}
): SubscriptionMode {
    if (isFreeSubscription(subscription)) {
        return isTrial ? SubscriptionMode.Trial : SubscriptionMode.Regular;
    }

    const currentPlan = SelectedPlan.createFromSubscription(subscription, plansMap);

    const selectedPlan = new SelectedPlan(planIDs ?? {}, plansMap, cycle, currency);

    if (currentPlan.getPlanName() !== selectedPlan.getPlanName() || currentPlan.currency !== selectedPlan.currency) {
        return SubscriptionMode.Regular;
    }

    const positiveDifference = planIDsPositiveDifference(currentPlan.planIDs, selectedPlan.planIDs);
    const hasMoreAddons = Object.values(positiveDifference).some((value) => value > 0);
    if (hasMoreAddons) {
        return SubscriptionMode.CustomBillings;
    }

    const negativeDifference = planIDsPositiveDifference(selectedPlan.planIDs, currentPlan.planIDs);
    const hasLessAddons = Object.values(negativeDifference).some((value) => value > 0);
    if (hasLessAddons) {
        return SubscriptionMode.ScheduledChargedLater;
    }

    if (selectedPlan.cycle > currentPlan.cycle) {
        return SubscriptionMode.ScheduledChargedImmediately;
    }

    if (selectedPlan.cycle < currentPlan.cycle) {
        return SubscriptionMode.ScheduledChargedLater;
    }

    return SubscriptionMode.Regular;
}
