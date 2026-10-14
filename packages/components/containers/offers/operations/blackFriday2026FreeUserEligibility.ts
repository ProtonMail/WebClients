import { differenceInHours, fromUnixTime } from 'date-fns';

import { hasIntentionalScheduledModification } from '../helpers/hasIntentionalScheduledModification';
import { isEligibleCurrency } from '../helpers/isEligibleCurrency';
import isSubscriptionCheckAllowed from '../helpers/isSubscriptionCheckAllowed';
import OfferSubscription from '../helpers/offerSubscription';
import type { BlackFriday2026EligibilityArgs } from './useBlackFriday2026Offer';

// Like the post-signup one dollar offer, accounts younger than this don't see the campaign yet.
export const BLACK_FRIDAY_2026_FREE_USER_MIN_ACCOUNT_AGE_HOURS = 5;

/**
 * The exclusions every BF 2026 free-user offer shares. Each offer adds its own app scope on top: the
 * Unlimited offer runs in any campaign app, while the Plus offers each run only where their product is.
 */
export function isEligibleFreeUser({
    user,
    subscription,
    offerConfig,
    preferredCurrency,
}: Omit<BlackFriday2026EligibilityArgs, 'protonConfig'>) {
    if (user.isDelinquent || !user.canPay || user.isPaid || hasIntentionalScheduledModification(subscription)) {
        return false;
    }

    const isAccountOldEnough =
        differenceInHours(new Date(), fromUnixTime(user.CreateTime)) >=
        BLACK_FRIDAY_2026_FREE_USER_MIN_ACCOUNT_AGE_HOURS;
    if (!isAccountOldEnough) {
        return false;
    }

    if (!isEligibleCurrency(preferredCurrency)) {
        return false;
    }

    if (subscription) {
        const offerSubscription = new OfferSubscription(subscription);
        if (
            offerSubscription.isTrial() ||
            offerSubscription.hasVisionary() ||
            offerSubscription.usedBlackFriday2026() ||
            !isSubscriptionCheckAllowed(subscription, offerConfig)
        ) {
            return false;
        }
    }

    return true;
}
