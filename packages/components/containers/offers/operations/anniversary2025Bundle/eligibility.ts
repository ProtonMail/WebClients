import { type Subscription, canModify } from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import { isValidStandaloneApp } from '../../helpers/anniversary2025';
import isCheckAllowed from '../../helpers/isCheckAllowed';
import OfferSubscription from '../../helpers/offerSubscription';
import { type OfferConfig } from '../../interface';

interface Props {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    offerConfig: OfferConfig;
}

export const getIsEligible = ({ user, subscription, protonConfig, offerConfig }: Props) => {
    if (!subscription) {
        return false;
    }

    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const checkAllowed = isCheckAllowed(subscription, offerConfig);
    const offerSubscription = new OfferSubscription(subscription);
    const isYearly = offerSubscription.isYearly() || offerSubscription.isTwoYears();
    const isYearlyMailPlus = offerSubscription.hasMail() && isYearly;
    const isYearlyPassPlus = offerSubscription.hasPass() && isYearly;
    const isYearlyVPNPlus = (offerSubscription.hasDeprecatedVPN() || offerSubscription.hasVPN2024()) && isYearly;
    const isDrivePlus = offerSubscription.hasDrive(); // For Drive Plus, we don't need to check the cycle
    const canModifySubscription = canModify(subscription);
    const noAnniversary2025Coupon = !offerSubscription.hasAnniversary2025Coupon();
    const hasValidApp =
        isValidStandaloneApp(protonConfig.APP_NAME) ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && isValidStandaloneApp(parentApp));

    return (
        hasValidApp &&
        checkAllowed &&
        canModifySubscription &&
        noAnniversary2025Coupon &&
        user.isPaid &&
        user.canPay &&
        !user.isDelinquent &&
        (isDrivePlus || isYearlyMailPlus || isYearlyPassPlus || isYearlyVPNPlus)
    );
};
