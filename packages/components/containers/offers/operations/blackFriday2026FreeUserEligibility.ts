import { hasIntentionalScheduledModification } from '../helpers/hasIntentionalScheduledModification';
import { isEligibleCurrency } from '../helpers/isEligibleCurrency';
import isSubscriptionCheckAllowed from '../helpers/isSubscriptionCheckAllowed';
import OfferSubscription from '../helpers/offerSubscription';
import type { BlackFriday2026EligibilityArgs } from './useBlackFriday2026Offer';

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
