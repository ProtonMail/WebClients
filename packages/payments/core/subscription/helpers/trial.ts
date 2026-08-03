import { addWeeks, fromUnixTime, isAfter, isBefore, subWeeks } from 'date-fns';

import { type ADDON_NAMES, ADDON_PREFIXES, PLANS } from '../../constants';
import { isAddonType } from '../../plan/addons';
import { isFreeSubscription, isPaidSubscription } from '../../type-guards';
import { Renew } from '../constants';
import type { MaybeFreeSubscription, Subscription } from '../interface';
import { getHasVpnB2BPlan } from './plan-b2b';
import { getPlanIDs } from './plan-ids';
import { getPlanName } from './plan-info';

export const isTrial = (subscription: MaybeFreeSubscription, plan?: PLANS): boolean => {
    if (isFreeSubscription(subscription) || !subscription) {
        return false;
    }

    const trial = !!subscription.IsTrial;

    if (!plan) {
        return trial;
    }

    return trial && getPlanName(subscription) === plan;
};

const autoRenewTrialPlans: Set<PLANS | ADDON_NAMES> = new Set([PLANS.VPN2024, PLANS.BUNDLE]);

// Remove the plan check once subscription.Renew is correctly set

export const isAutoRenewTrial = (subscription: MaybeFreeSubscription): boolean => {
    // this function assumes that the subscription will auto-renew based on the plan. That's false, and the only thing
    // that keeps it "auto-renewing" is presence of the payment method. This function should be removed, and we need to
    // introduce a hook that checks if user has a payment methods and it has a trial. Then it means an auto-renewing
    // trial (assuming that subscription renewal wasn't cancelled by the user manually).
    return (
        // (isTrial(subscription) && subscription?.Renew) ||
        isTrial(subscription) && !!subscription?.Plans?.some((plan) => autoRenewTrialPlans.has(plan.Name))
    );
};

export const isTrialRenewing = (subscription: MaybeFreeSubscription): boolean => {
    return isTrial(subscription) && isPaidSubscription(subscription) && subscription.Renew === Renew.Enabled;
};

export const isTrialExpired = (subscription: Subscription | undefined): boolean => {
    if (!isTrial(subscription)) {
        return false;
    }

    const now = new Date();
    return now > fromUnixTime(subscription?.PeriodEnd || 0);
};

export const hasTrialExpiredLessThan4Weeks = (subscription: Subscription | undefined): boolean => {
    const now = new Date();
    return isAfter(fromUnixTime(subscription?.PeriodEnd || 0), subWeeks(now, 4));
};

export const willTrialExpireInLessThan1Week = (subscription: Subscription | undefined): boolean => {
    const now = new Date();
    return isBefore(fromUnixTime(subscription?.PeriodEnd || 0), addWeeks(now, 1));
};

export function isCancellableOnlyViaSupport(subscription: MaybeFreeSubscription): boolean {
    if (isTrial(subscription)) {
        // Always allow canceling trials without contacting support
        return false;
    }

    if (getHasVpnB2BPlan(subscription)) {
        return true;
    }

    const otherPlansWithIpAddons = [PLANS.BUNDLE_PRO, PLANS.BUNDLE_PRO_2024];
    if (otherPlansWithIpAddons.includes(getPlanName(subscription) as PLANS)) {
        const hasIpAddons = (Object.keys(getPlanIDs(subscription)) as (PLANS | ADDON_NAMES)[]).some((plan) =>
            isAddonType(plan, ADDON_PREFIXES.IP)
        );
        return hasIpAddons;
    }

    return false;
}

/**
 * Checks if subscription can be cancelled by a user. Cancellation means that the user will be downgraded at the end
 * of the current billing cycle. In contrast, "Downgrade subscription" button means that the user will be downgraded
 * immediately. Note that B2B subscriptions also have "Cancel subscription" button, but it behaves differently, so
 * we don't consider B2B subscriptions cancellable for the purpose of this function.
 */
export const hasCancellablePlan = (subscription: MaybeFreeSubscription): boolean => {
    return !isCancellableOnlyViaSupport(subscription);
};
