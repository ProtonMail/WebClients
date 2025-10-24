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
        protonConfig?.APP_NAME === APPS.PROTONDRIVE ||
        (protonConfig?.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONDRIVE);
    const { canPay, isDelinquent, isPaid } = user;
    const isExternal = isManagedExternally(subscription);

    const isPreferredCurrencyEligible = hasEligibileCurrencyForBF(preferredCurrency);

    // delinquent, can't pay, has intentional scheduled modification, external subscription
    if (isDelinquent || !canPay || hasIntentionalScheduledModification(subscription) || isExternal) {
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
            const hasDriveYearly =
                (offerSubscription.hasDrive() || offerSubscription.hasDrive1TB()) && offerSubscription.hasYearlyCycle();

            const hasOtherPlanAndNotDrive =
                (offerSubscription.hasMail() ||
                    offerSubscription.hasVPN2024() ||
                    offerSubscription.hasDeprecatedVPN() ||
                    offerSubscription.hasVPNPassBundle() ||
                    offerSubscription.hasPass()) &&
                offerSubscription.hasYearlyCycle() &&
                !offerSubscription.hasDrive() &&
                !offerSubscription.hasDrive1TB();

            // Is on the correct app, has the correct currency, has the correct plan, and can modify the subscription
            return (
                hasValidApp &&
                isPreferredCurrencyEligible &&
                (hasDriveYearly || hasOtherPlanAndNotDrive) &&
                canModifySubscription
            );
        }
    }

    return false;
};

export default isEligible;
