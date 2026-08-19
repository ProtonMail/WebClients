import type { Currency } from '@proton/payments/core/interface';
import { hasIntentionalScheduledModification } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import { isCampaignApp } from '../../helpers/isCampaignApp';
import { isEligibleCurrency } from '../../helpers/isEligibleCurrency';
import isSubscriptionCheckAllowed from '../../helpers/isSubscriptionCheckAllowed';
import OfferSubscription from '../../helpers/offerSubscription';
import type { OfferConfig } from '../../interface';

// Targets free users, offering Unlimited 12M. Being free is not product-specific, so this runs in any
// campaign app; the tracking ref records which one the user converted from.
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
            offerSubscription.usedQ3Sale2026() ||
            !isSubscriptionCheckAllowed(subscription, offerConfig)
        ) {
            return false;
        }
    }

    return isCampaignApp(protonConfig, window.location.pathname);
}
