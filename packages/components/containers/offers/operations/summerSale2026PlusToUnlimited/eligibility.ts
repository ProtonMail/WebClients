import type { Currency, Subscription } from '@proton/payments';
import { hasIntentionalScheduledModification } from '@proton/payments/core/subscription/helpers';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';
import { hasPassLifetime, hasPassViaSimpleLogin } from '@proton/shared/lib/user/helpers';

import { isEligibleCurrency } from '../../helpers/isEligibleCurrency';
import isSubscriptionCheckAllowed from '../../helpers/isSubscriptionCheckAllowed';
import OfferSubscription from '../../helpers/offerSubscription';
import type { OfferConfig } from '../../interface';

// Targets paid single-product users in the Mail app (Mail Plus, Drive, Pass, or VPN) who can upgrade to Unlimited.
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
        offerSubscription.usedSummerSale2026()
    ) {
        return false;
    }

    const hasMail = offerSubscription.hasMail();
    const hasPass = offerSubscription.hasPass();
    const hasVPN = offerSubscription.hasVPN2024();
    const hasDrive = offerSubscription.hasDrive();
    const hasPassWithLifetimeOrSimpleLogin = hasPass || hasPassLifetime(user) || hasPassViaSimpleLogin(user);

    const parentApp = getAppFromPathnameSafe(window.location.pathname);

    const isValidApp =
        protonConfig.APP_NAME === APPS.PROTONMAIL ||
        protonConfig.APP_NAME === APPS.PROTONCALENDAR ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONCALENDAR) ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONMAIL);

    return user.isPaid && isValidApp && (hasMail || hasPassWithLifetimeOrSimpleLogin || hasVPN || hasDrive);
}
