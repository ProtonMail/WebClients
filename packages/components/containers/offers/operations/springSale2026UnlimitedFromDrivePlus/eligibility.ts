import type { Currency, Subscription } from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';
import { hasPassLifetime, hasPassViaSimpleLogin } from '@proton/shared/lib/user/helpers';

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
    if (user.isDelinquent || !user.canPay || !subscription || !isSubscriptionCheckAllowed(subscription, offerConfig)) {
        return false;
    }

    if (!isEligibleCurrency(preferredCurrency)) {
        return false;
    }

    const offerSubscription = new OfferSubscription(subscription);
    const notBundle = !offerSubscription.hasBundle();
    const notDuo = !offerSubscription.hasDuo();
    const notFamily = !offerSubscription.hasFamily();
    const notUsedCurrentPromo = !offerSubscription.usedSpringSale2026();

    if (offerSubscription.isManagedExternally()) {
        // Exclude mobile
        return false;
    }

    const parentApp = getAppFromPathnameSafe(window.location.pathname);

    const hasMail = offerSubscription.hasMail();
    const hasDrive = offerSubscription.hasDrive();
    const hasPassWithLifetimeOrSimpleLogin =
        offerSubscription.hasPass() || hasPassLifetime(user) || hasPassViaSimpleLogin(user);
    const hasVPN = offerSubscription.hasVPN2024() || offerSubscription.hasDeprecatedVPN();

    if (
        user.isPaid &&
        isInApp(protonConfig, APPS.PROTONDRIVE, parentApp) &&
        (hasMail || hasDrive || hasPassWithLifetimeOrSimpleLogin || hasVPN) &&
        notBundle &&
        notDuo &&
        notFamily &&
        notUsedCurrentPromo
    ) {
        return true;
    }

    return false;
}
