import {
    type Currency,
    type Subscription,
    hasIntentionalScheduledModification,
    isManagedExternally,
} from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import { isIos, isIpad } from '@proton/shared/lib/helpers/browser';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';
import { hasPassLifetimeOrViaSimpleLogin } from '@proton/shared/lib/user/helpers';

import hasEligibileCurrencyForBF from '../../helpers/hasEligibileCurrencyForBF';
import isSubscriptionCheckAllowed from '../../helpers/isSubscriptionCheckAllowed';
import OfferSubscription from '../../helpers/offerSubscription';
import type { OfferConfig } from '../../interface';

interface Props {
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    user: UserModel;
    offerConfig: OfferConfig;
    lastSubscriptionEnd?: number;
    preferredCurrency: Currency;
}

const isEligible = ({ subscription, protonConfig, user, offerConfig, preferredCurrency }: Props) => {
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const hasValidApp =
        protonConfig?.APP_NAME === APPS.PROTONLUMO ||
        (protonConfig?.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONLUMO);

    const { canPay, isDelinquent, isFree } = user;
    const isExternal = isManagedExternally(subscription);
    const hasForbiddenPassSubscription = hasPassLifetimeOrViaSimpleLogin(user);

    const isPreferredCurrencyEligible = hasEligibileCurrencyForBF(preferredCurrency);

    const isIpadIos = isIpad() || isIos();

    // delinquent, can't pay, has intentional scheduled modification, external subscription, has forbidden pass
    // subscription
    if (
        isDelinquent ||
        !canPay ||
        hasIntentionalScheduledModification(subscription) ||
        isExternal ||
        hasForbiddenPassSubscription ||
        isIpadIos
    ) {
        return false;
    }

    // has BF 2025 coupon or not allowed to modify subscription
    if (subscription) {
        const offerSubscription = new OfferSubscription(subscription);
        if (offerSubscription.hasBF2025Coupon() || !isSubscriptionCheckAllowed(subscription, offerConfig)) {
            return false;
        }
    }

    return hasValidApp && isPreferredCurrencyEligible && isFree;
};

export default isEligible;
