import { hasIntentionalScheduledModification } from '../../helpers/hasIntentionalScheduledModification';
import { isCampaignApp } from '../../helpers/isCampaignApp';
import { isEligibleCurrency } from '../../helpers/isEligibleCurrency';
import isSubscriptionCheckAllowed from '../../helpers/isSubscriptionCheckAllowed';
import OfferSubscription from '../../helpers/offerSubscription';
import type { BlackFriday2026EligibilityArgs } from '../useBlackFriday2026Offer';

// Targets paid single-product users (Mail Plus, Drive Plus, VPN Plus or Pass Plus), offering Unlimited
// 12M. The spec evaluates Inbox and Drive separately, but both accept the same four plans (paid here, or
// paid elsewhere and free here), so the audience is identical in every campaign app and the tracking ref
// records which one. Mobile subscribers are excluded to avoid double-dipping with app store subscriptions.
export function getIsEligible({
    user,
    subscription,
    protonConfig,
    offerConfig,
    preferredCurrency,
}: BlackFriday2026EligibilityArgs) {
    if (
        user.isDelinquent ||
        !user.canPay ||
        !subscription ||
        hasIntentionalScheduledModification(subscription) ||
        !isSubscriptionCheckAllowed(subscription, offerConfig)
    ) {
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
        offerSubscription.hasBundle() ||
        offerSubscription.hasDuo() ||
        offerSubscription.hasFamily() ||
        offerSubscription.usedBlackFriday2026()
    ) {
        return false;
    }

    const hasEligiblePlan =
        offerSubscription.hasMail() ||
        offerSubscription.hasDrive() ||
        offerSubscription.hasDrive1TB() ||
        offerSubscription.hasDeprecatedVPN() ||
        offerSubscription.hasVPN2024() ||
        offerSubscription.hasPass();

    return user.isPaid && hasEligiblePlan && isCampaignApp(protonConfig, window.location.pathname);
}
