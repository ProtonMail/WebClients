import { isInApp } from '@proton/components/containers/offers/helpers/isInApp';
import { CYCLE, type Currency, PLANS, type Subscription } from '@proton/payments';
import { hasIntentionalScheduledModification } from '@proton/payments/core/subscription/helpers';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import { isEligibleCurrency } from '../../helpers/isEligibleCurrency';
import isSubscriptionCheckAllowed from '../../helpers/isSubscriptionCheckAllowed';
import OfferSubscription from '../../helpers/offerSubscription';
import type { OfferConfig } from '../../interface';

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

    if (user.isDelinquent || !user.canPay || hasIntentionalScheduledModification(subscription)) {
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
            offerSubscription.usedSpringSale2026() ||
            !isSubscriptionCheckAllowed(subscription, offerConfig) ||
            offerSubscription.isManagedExternally()
        ) {
            return false;
        }
    }

    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const isValidApp =
        isInApp(protonConfig, APPS.PROTONMAIL, parentApp) ||
        isInApp(protonConfig, APPS.PROTONCALENDAR, parentApp) ||
        isInApp(protonConfig, APPS.PROTONDRIVE, parentApp) ||
        isInApp(protonConfig, APPS.PROTONPASS, parentApp) ||
        isInApp(protonConfig, APPS.PROTONVPN_SETTINGS, parentApp);

    const bundlePlan = subscription?.Plans?.find((plan) => plan.Name === PLANS.BUNDLE);

    if (isValidApp && bundlePlan && bundlePlan.Cycle === CYCLE.YEARLY) {
        return true;
    }

    return false;
}
