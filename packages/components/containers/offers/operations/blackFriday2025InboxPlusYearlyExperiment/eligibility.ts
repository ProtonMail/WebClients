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

import { BF_EXPERIMENT_GROUP_VALUES } from '../../helpers/experimentHelpers';
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
    userInExperiment?: number;
}

const isEligible = ({
    subscription,
    protonConfig,
    user,
    offerConfig,
    preferredCurrency,
    userInExperiment = 0,
}: Props) => {
    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const hasValidApp =
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONMAIL) ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONCALENDAR) ||
        protonConfig.APP_NAME === APPS.PROTONCALENDAR ||
        protonConfig.APP_NAME === APPS.PROTONMAIL;
    const { canPay, isDelinquent, isPaid } = user;
    const isExternal = isManagedExternally(subscription);
    const hasForbiddenPassSubscription = hasPassLifetimeOrViaSimpleLogin(user);

    const isPreferredCurrencyEligible = hasEligibileCurrencyForBF(preferredCurrency);

    // this offer is only for group A
    if (userInExperiment !== BF_EXPERIMENT_GROUP_VALUES.GROUP_CONTROL_VALUE) {
        return false;
    }

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
            const hasMailYearlyOrFifteen =
                offerSubscription.hasMail() &&
                (offerSubscription.hasYearlyCycle() || offerSubscription.hasFifteenMonthsCycle());

            const hasOtherPlanAndNotMail =
                (offerSubscription.hasDrive() ||
                    offerSubscription.hasDrive1TB() ||
                    offerSubscription.hasVPN2024() ||
                    offerSubscription.hasDeprecatedVPN() ||
                    offerSubscription.hasVPNPassBundle() ||
                    offerSubscription.hasPass()) &&
                (offerSubscription.hasYearlyCycle() || offerSubscription.hasFifteenMonthsCycle()) &&
                !offerSubscription.hasMail();

            // Is on the correct app, has the correct currency, has the correct plan, and can modify the subscription
            return (
                hasValidApp &&
                isPreferredCurrencyEligible &&
                (hasMailYearlyOrFifteen || hasOtherPlanAndNotMail) &&
                canModifySubscription
            );
        }
    }

    return false;
};

export default isEligible;
