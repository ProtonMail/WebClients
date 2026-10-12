import { hasIntentionalScheduledModification } from '../../helpers/hasIntentionalScheduledModification';
import { isCampaignApp } from '../../helpers/isCampaignApp';
import { isEligibleCurrency } from '../../helpers/isEligibleCurrency';
import isSubscriptionCheckAllowed from '../../helpers/isSubscriptionCheckAllowed';
import OfferSubscription from '../../helpers/offerSubscription';
import type { BlackFriday2026EligibilityArgs } from '../useBlackFriday2026Offer';

// Targets Unlimited users on any cycle, offering Duo 12M. Unlimited is an account-level plan, so the
// audience is the same in every campaign app and the tracking ref records which one. Mobile subscribers
// are excluded to avoid double-dipping with app store subscriptions.
export function getIsEligible({
    user,
    subscription,
    protonConfig,
    offerConfig,
    preferredCurrency,
}: BlackFriday2026EligibilityArgs) {
    if (user.isDelinquent || !user.canPay || !subscription || hasIntentionalScheduledModification(subscription)) {
        return false;
    }

    if (!isEligibleCurrency(preferredCurrency)) {
        return false;
    }

    const offerSubscription = new OfferSubscription(subscription);

    if (
        offerSubscription.isTrial() ||
        offerSubscription.isManagedExternally() ||
        offerSubscription.hasVisionary() ||
        offerSubscription.usedBlackFriday2026() ||
        !isSubscriptionCheckAllowed(subscription, offerConfig)
    ) {
        return false;
    }

    return user.isPaid && offerSubscription.hasBundle() && isCampaignApp(protonConfig, window.location.pathname);
}
