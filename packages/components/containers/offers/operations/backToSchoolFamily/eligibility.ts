import { type Subscription, canModify } from '@proton/payments';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import OfferSubscription from '../../helpers/offerSubscription';
import type { OfferConfig } from '../../interface';

interface Props {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    offerConfig: OfferConfig;
}

export const getIsEligible = ({ user, subscription }: Props) => {
    if (
        user.isDelinquent ||
        !user.canPay ||
        !subscription ||
        subscription.UpcomingSubscription ||
        !canModify(subscription)
    ) {
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
