import type { Currency, Subscription } from '@proton/payments';
import { hasIntentionalScheduledModification } from '@proton/payments/core/subscription/helpers';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import { isEligibleCurrency } from '../../helpers/isEligibleCurrency';
import { isInApp } from '../../helpers/isInApp';
import isSubscriptionCheckAllowed from '../../helpers/isSubscriptionCheckAllowed';
import OfferSubscription from '../../helpers/offerSubscription';
import type { OfferConfig } from '../../interface';

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
            offerSubscription.hasVisionary() ||
            offerSubscription.usedSpringSale2026() ||
            !isSubscriptionCheckAllowed(subscription, offerConfig) ||
            offerSubscription.isManagedExternally()
        ) {
            return false;
        }
    }

    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    return isInApp(protonConfig, APPS.PROTONLUMO, parentApp);
}
