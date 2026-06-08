import type { Currency, Subscription } from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import { isEligibleCurrency } from '../../helpers/isEligibleCurrency';
import isSubscriptionCheckAllowed from '../../helpers/isSubscriptionCheckAllowed';
import OfferSubscription from '../../helpers/offerSubscription';
import type { OfferConfig } from '../../interface';

// Targets Drive Plus users (any cycle) in the Drive app who can upgrade to Unlimited.
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
    if (user.isDelinquent || !user.canPay || !subscription || !isSubscriptionCheckAllowed(subscription, offerConfig)) {
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
        offerSubscription.usedSummerSale2026()
    ) {
        return false;
    }

    const hasMail = offerSubscription.hasMail();
    const hasPass = offerSubscription.hasPass();
    const hasVPN = offerSubscription.hasVPN2024();

    const parentApp = getAppFromPathnameSafe(window.location.pathname);

    const isValidApp =
        protonConfig.APP_NAME === APPS.PROTONDRIVE ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONDRIVE);

    return user.isPaid && isValidApp && (offerSubscription.hasDrive() || hasMail || hasPass || hasVPN);
}
