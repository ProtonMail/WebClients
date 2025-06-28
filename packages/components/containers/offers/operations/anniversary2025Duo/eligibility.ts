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
    const offerSubscription = new OfferSubscription(subscription);
    const isBundle = offerSubscription.hasBundle();
    const canModifySubscription = canModify(subscription);
    const noAnniversary2025Coupon = !offerSubscription.hasAnniversary2025Coupon();
    const checkAllowed = isCheckAllowed(subscription, offerConfig);
    const hasValidApp =
        isValidStandaloneApp(protonConfig.APP_NAME) ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && isValidStandaloneApp(parentApp));

    return (
        hasValidApp &&
        checkAllowed &&
        canModifySubscription &&
        noAnniversary2025Coupon &&
        user.canPay &&
        !user.isDelinquent &&
        isBundle
    );
};
