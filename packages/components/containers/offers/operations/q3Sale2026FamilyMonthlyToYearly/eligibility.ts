import type { Currency } from '@proton/payments/core/interface';
import { hasIntentionalScheduledModification } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import { isEligibleCurrency } from '../../helpers/isEligibleCurrency';
import isSubscriptionCheckAllowed from '../../helpers/isSubscriptionCheckAllowed';
import OfferSubscription from '../../helpers/offerSubscription';
import type { OfferConfig } from '../../interface';

// Targets monthly Family users in the inbox apps, offering the same Family 12M deal as
// q3Sale2026DuoToFamily. Yearly Family users are already on the target plan and cycle,
// so they must not be eligible.
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
        offerSubscription.usedQ3Sale2026()
    ) {
        return false;
    }

    if (!offerSubscription.hasFamily() || !offerSubscription.hasMonthlyCycle()) {
        return false;
    }

    const parentApp = getAppFromPathnameSafe(window.location.pathname);

    return (
        user.isPaid &&
        (protonConfig.APP_NAME === APPS.PROTONMAIL ||
            protonConfig.APP_NAME === APPS.PROTONCALENDAR ||
            (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONMAIL) ||
            (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONCALENDAR))
    );
}
