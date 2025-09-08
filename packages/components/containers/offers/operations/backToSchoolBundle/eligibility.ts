import type { Subscription } from '@proton/payments';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import { userHasSupportedProduct } from '../../helpers/backToSchool';
import OfferSubscription from '../../helpers/offerSubscription';
import type { OfferConfig } from '../../interface';

interface Props {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    offerConfig: OfferConfig;
}

export const getIsEligible = ({ user, subscription }: Props) => {
    if (user.isDelinquent || !user.canPay || !subscription || subscription.UpcomingSubscription) {
        return false;
    }

    const offerSubscription = new OfferSubscription(subscription);
    const notBundle = !offerSubscription.hasBundle();
    const notDuo = !offerSubscription.hasDuo();
    const notUsedCurrentPromo = !offerSubscription.usedBackToSchoolPromo();
    if (user.isPaid && userHasSupportedProduct(subscription) && notBundle && notDuo && notUsedCurrentPromo) {
        return true;
    }

    return false;
};
