import type { Currency, Subscription } from '@proton/payments';
import { hasIntentionalScheduledModification } from '@proton/payments/core/subscription/helpers';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import { isEligibleCurrency } from '../../helpers/isEligibleCurrency';
import isSubscriptionCheckAllowed from '../../helpers/isSubscriptionCheckAllowed';
import OfferSubscription from '../../helpers/offerSubscription';
import type { OfferConfig } from '../../interface';

// Segment A (cross-product free users) — Wave 1: show Unlimited 12M at 50% off in Drive app.
// userInExperiment is sourced from SummerSale2026CrossProductExperiment (integer, set by BE).
export function getIsEligible({
    user,
    subscription,
    protonConfig,
    offerConfig,
    userInExperiment = 0,
    preferredCurrency,
}: {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    offerConfig: OfferConfig;
    userInExperiment: number;
    preferredCurrency: Currency;
}) {
    if (userInExperiment !== 1) {
        return false;
    }

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
            offerSubscription.usedSummerSale2026() ||
            !isSubscriptionCheckAllowed(subscription, offerConfig)
        ) {
            return false;
        }
    }

    const parentApp = getAppFromPathnameSafe(window.location.pathname);

    return (
        protonConfig.APP_NAME === APPS.PROTONDRIVE ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONDRIVE)
    );
}
