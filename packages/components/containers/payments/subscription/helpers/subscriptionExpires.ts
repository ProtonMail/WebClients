import { differenceInDays, fromUnixTime } from 'date-fns';
import { c, msgid } from 'ttag';

import { type Subscription, SubscriptionPlatform, isManagedExternally } from '@proton/payments';

/**
 * Generates a subscription expiration message based on the plan name and the number of days left.
 *
 * @param {string} planName - The name of the subscription plan.
 * @param {number} daysLeft - The number of days remaining until the subscription expires.
 * @returns {string} A message indicating when the subscription will expire.
 */
export const getSubscriptionExpiresText = (planName: string, daysLeft: number) => {
    const daysLeftPluralString = c('Info').ngettext(
        msgid`${planName} expires in ${daysLeft} day.`,
        `${planName} expires in ${daysLeft} days.`,
        daysLeft
    );

    return daysLeft > 0 ? daysLeftPluralString : c('Info').t`${planName} expires today.`;
};

/**
 * Returns the number of days left for the subscription to expire.
 * @param expirationDate {number} Unix timestamp for expiration date.
 * @param now {Date} Current date.
 * @returns {number} The number of days.
 */
export const getSubscriptionExpiresDaysLeft = (expirationDate: number, now: Date) => {
    return differenceInDays(fromUnixTime(expirationDate), now);
};

/**
 * Generates an action object for reactivating a subscription, based on whether the subscription
 * is managed externally or internally. For externally managed subscriptions, it returns a URL
 * to the corresponding subscription management platform. For internally managed subscriptions,
 * it returns a relative path to the subscription management page.
 *
 * @param {Subscription} subscription - The subscription object, which includes details about how the subscription is managed.
 * @param {string} [source] - An optional query parameter to specify the source context for internal reactivation.
 * @returns {{ type: 'external'; platform: SubscriptionPlatform; href: string } | { type: 'internal'; path: string }}
 *          An object indicating the action to take. For externally managed subscriptions, it includes
 *          the platform and an external link. For internally managed subscriptions, it includes the
 *          relative path to the subscription management page.
 */
export const getReactivateSubscriptionAction = (
    subscription: Subscription,
    source?: string
): { type: 'external'; platform: SubscriptionPlatform; href: string } | { type: 'internal'; path: string } => {
    if (isManagedExternally(subscription)) {
        if (subscription.External === SubscriptionPlatform.Android) {
            return {
                type: 'external',
                platform: SubscriptionPlatform.Android,
                href: 'https://play.google.com/store/account/subscriptions',
            };
        }
        if (subscription.External === SubscriptionPlatform.iOS) {
            return {
                type: 'external',
                platform: SubscriptionPlatform.iOS,
                href: 'https://apps.apple.com/account/subscriptions',
            };
        }
    }
    /**
     * NOTE: This 'dashboard' pathname is redirected to subscription by account/vpn depending on if dashboard v2 or v1 is enabled.
     */
    const url = new URL('/dashboard#your-subscriptions', window.location.origin /* base not used*/);
    if (source) {
        url.searchParams.append('source', source);
    }
    return { type: 'internal', path: url.href.replace(url.origin, '') };
};
