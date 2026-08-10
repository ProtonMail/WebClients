import type { Currency } from '@proton/payments/core/interface';
import { hasIntentionalScheduledModification } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';
import { hasPassLifetimeOrViaSimpleLogin } from '@proton/shared/lib/user/helpers';

import { isEligibleCurrency } from '../../helpers/isEligibleCurrency';
import isSubscriptionCheckAllowed from '../../helpers/isSubscriptionCheckAllowed';
import OfferSubscription from '../../helpers/offerSubscription';
import type { OfferConfig } from '../../interface';

// Targets paid single-product users in the inbox apps — Mail Plus, or users paying for VPN, Pass or
// Drive while using Mail for free — offering Unlimited 12M.
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
        offerSubscription.hasDeprecatedVPN() ||
        offerSubscription.hasVPN2024() ||
        offerSubscription.hasPass() ||
        offerSubscription.hasDrive() ||
        offerSubscription.hasDrive1TB() ||
        hasPassLifetimeOrViaSimpleLogin(user);

    const parentApp = getAppFromPathnameSafe(window.location.pathname);

    const isValidApp =
        protonConfig.APP_NAME === APPS.PROTONMAIL ||
        protonConfig.APP_NAME === APPS.PROTONCALENDAR ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONMAIL) ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONCALENDAR);

    return user.isPaid && isValidApp && hasEligiblePlan;
}
