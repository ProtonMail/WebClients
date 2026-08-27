import type { Currency } from '@proton/payments/core/interface';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import { hasIntentionalScheduledModification } from '../../helpers/hasIntentionalScheduledModification';
import { isCampaignApp } from '../../helpers/isCampaignApp';
import { isEligibleCurrency } from '../../helpers/isEligibleCurrency';
import isSubscriptionCheckAllowed from '../../helpers/isSubscriptionCheckAllowed';
import OfferSubscription from '../../helpers/offerSubscription';
import type { OfferConfig } from '../../interface';

// Targets paid single-product users — Mail Plus, Drive Plus, VPN or Pass Plus — offering Unlimited
// 12M. The audience is the same in every campaign app: a user paying for one product who could move
// up to the bundle. Pass lifetime and Pass-via-SimpleLogin users are deliberately excluded.
export function getIsEligible({
    user,
    subscription,
    protonConfig,
    offerConfig,
    preferredCurrency,
}: {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    offerConfig: OfferConfig;
    preferredCurrency: Currency;
}) {
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
        offerSubscription.usedQ3Sale2026()
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
