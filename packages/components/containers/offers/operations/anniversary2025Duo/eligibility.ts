import { type Subscription } from '@proton/payments/index';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import { isValidStandaloneApp } from '../../helpers/anniversary2025';
import OfferSubscription from '../../helpers/offerSubscription';

interface Props {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
}

export const getIsEligible = ({ user, subscription, protonConfig }: Props) => {
    if (!subscription) {
        return false;
    }

    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const offerSubscription = new OfferSubscription(subscription);
    const isBundle = offerSubscription.hasBundle();
    const isNotExternal = !offerSubscription.isManagedExternally();
    const noAnniversary2025Coupon = !offerSubscription.hasAnniversary2025Coupon();
    const hasValidApp =
        isValidStandaloneApp(protonConfig.APP_NAME) ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && isValidStandaloneApp(parentApp));

    return hasValidApp && isNotExternal && noAnniversary2025Coupon && user.canPay && !user.isDelinquent && isBundle;
};
