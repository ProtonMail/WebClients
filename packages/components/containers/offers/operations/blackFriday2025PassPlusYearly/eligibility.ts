import {
    type Currency,
    type Subscription,
    canModify,
    hasIntentionalScheduledModification,
    isManagedExternally,
} from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';
import { hasPassLifetimeOrViaSimpleLogin } from '@proton/shared/lib/user/helpers';

import { hasEligibileCurrencyForPassBF } from '../../helpers/hasEligibileCurrencyForBF';
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
        protonConfig?.APP_NAME === APPS.PROTONPASS ||
        (protonConfig?.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONPASS);

    const { canPay, isDelinquent, isPaid } = user;
    const isExternal = isManagedExternally(subscription);
    const hasForbiddenPassSubscription = hasPassLifetimeOrViaSimpleLogin(user);

    const isPreferredCurrencyEligible = hasEligibileCurrencyForPassBF(preferredCurrency);

    // delinquent, can't pay, has intentional scheduled modification, external subscription, has forbidden pass
    // subscription
    if (
        isDelinquent ||
        !canPay ||
        hasIntentionalScheduledModification(subscription) ||
        isExternal ||
        hasForbiddenPassSubscription
    ) {
        return false;
    }

    if (subscription) {
        const offerSubscription = new OfferSubscription(subscription);

        // has BF 2025 coupon or not allowed to modify subscription
        if (offerSubscription.hasBF2025Coupon() || !isSubscriptionCheckAllowed(subscription, offerConfig)) {
            return false;
        }

        if (isPaid) {
            const canModifySubscription = canModify(subscription);
            const hasPassYearlyOrFifteen =
                offerSubscription.hasPass() &&
                (offerSubscription.hasYearlyCycle() || offerSubscription.hasFifteenMonthsCycle());

            const hasOtherPlanAndNotPass =
                (offerSubscription.hasDrive() ||
                    offerSubscription.hasDrive1TB() ||
                    offerSubscription.hasVPN2024() ||
                    offerSubscription.hasDeprecatedVPN() ||
                    offerSubscription.hasVPNPassBundle() ||
                    offerSubscription.hasMail()) &&
                offerSubscription.hasYearlyCycle() &&
                !offerSubscription.hasPass();

            // Is on the correct app, has the correct currency, has the correct plan, and can modify the subscription
            return (
                hasValidApp &&
                isPreferredCurrencyEligible &&
                (hasPassYearlyOrFifteen || hasOtherPlanAndNotPass) &&
                canModifySubscription
            );
        }
    }

    return false;
};

export default isEligible;
