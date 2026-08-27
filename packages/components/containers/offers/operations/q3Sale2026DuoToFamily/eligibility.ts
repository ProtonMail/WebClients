import type { Currency } from '@proton/payments/core/interface';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import { hasIntentionalScheduledModification } from '../../helpers/hasIntentionalScheduledModification';
import { isCampaignApp } from '../../helpers/isCampaignApp';
import { isEligibleCurrency } from '../../helpers/isEligibleCurrency';
import isSubscriptionCheckAllowed from '../../helpers/isSubscriptionCheckAllowed';
import OfferSubscription from '../../helpers/offerSubscription';
import type { OfferConfig } from '../../interface';

// Targets Duo users, offering Family 12M. Duo is an account-level plan, so the audience is the same
// in every campaign app, with the ref recording which one via the deal's getRef.
// Monthly Family users are handled by q3Sale2026FamilyMonthlyToYearly, which carries its own ref.
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
        offerSubscription.usedQ3Sale2026() ||
        !isSubscriptionCheckAllowed(subscription, offerConfig)
    ) {
        return false;
    }

    return user.isPaid && offerSubscription.hasDuo() && isCampaignApp(protonConfig, window.location.pathname);
}
