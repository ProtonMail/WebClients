import type { Subscription } from '@proton/payments';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import isSubscriptionCheckAllowed from '../../helpers/isSubscriptionCheckAllowed';
import OfferSubscription from '../../helpers/offerSubscription';
import type { OfferConfig } from '../../interface';

interface Props {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    offerConfig: OfferConfig;
}

export const getIsEligible = ({ user, subscription, offerConfig }: Props) => {
    if (user.isDelinquent || !user.canPay || !subscription || !isSubscriptionCheckAllowed(subscription, offerConfig)) {
        return false;
    }

    const offerSubscription = new OfferSubscription(subscription);
    const isDuo = offerSubscription.hasDuo();
    const notUsedCurrentPromo = !offerSubscription.usedBackToSchoolPromo();

    if (user.isPaid && isDuo && notUsedCurrentPromo) {
        return true;
    }

    return false;
};
