import type { FreeSubscription } from '../../interface';
import { isFreeSubscription } from '../../type-guards';
import { SubscriptionPlatform } from '../constants';
import type { Subscription } from '../interface';
import { hasLumo } from './plan-matching';

export const isManagedExternally = (
    subscription: Subscription | FreeSubscription | undefined | Pick<Subscription, 'External'> | null
): boolean => {
    if (!subscription || isFreeSubscription(subscription)) {
        return false;
    }

    return subscription.External === SubscriptionPlatform.Android || subscription.External === SubscriptionPlatform.iOS;
};

/**
 * If user has multisubs, then this function will transform the nested secondary subscriptions into a flat array.
 * This is useful for functions that need to iterate over all subscriptions.
 */
export const getSubscriptionsArray = (subscription: Subscription): Subscription[] => {
    return [subscription, ...(subscription.SecondarySubscriptions ?? [])];
};

export function hasNoExternallyManagedLumoSubscription(subscription: Subscription | FreeSubscription): boolean {
    if (isFreeSubscription(subscription)) {
        return true;
    }

    // Check if the current subscription or any of the secondary subscriptions has a mobile lumo subscription.
    return ![subscription, ...(subscription.SecondarySubscriptions ?? [])].some(
        (sub) => hasLumo(sub) && isManagedExternally(sub)
    );
}

export const hasLumoMobileSubscription = (subscription: Subscription | FreeSubscription | undefined) => {
    if (!subscription || isFreeSubscription(subscription)) {
        return false;
    }

    if (isManagedExternally(subscription) && hasLumo(subscription)) {
        return true;
    }

    for (const secondarySubscription of subscription.SecondarySubscriptions ?? []) {
        if (isManagedExternally(secondarySubscription) && hasLumo(secondarySubscription)) {
            return true;
        }
    }

    return false;
};
