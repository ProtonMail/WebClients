import type { FreeSubscription } from '../core/interface';
import { getPlanName } from '../core/subscription/helpers/plan-info';
import type { Subscription } from '../core/subscription/interface';
import { isFreeSubscription } from '../core/type-guards';

/**
 * Identifies a subscription by what it costs the user: `{planName}-{currency}-{cycle}`,
 * e.g. `mail2022-EUR-1m`. Free, absent and unresolvable subscriptions are `null`.
 *
 * Deliberately excludes anything that could identify the user themselves.
 */
export const getSubscriptionKey = (subscription: Subscription | FreeSubscription | null | undefined): string | null => {
    if (!subscription || isFreeSubscription(subscription)) {
        return null;
    }

    const planName = getPlanName(subscription);
    if (!planName) {
        return null;
    }

    return `${planName}-${subscription.Currency}-${subscription.Cycle}m`;
};

export const getSubscriptionKeys = (subscription: Subscription | FreeSubscription | null | undefined) => ({
    subscriptionKey: getSubscriptionKey(subscription),
    upcomingSubscriptionKey: getSubscriptionKey(subscription?.UpcomingSubscription),
});
