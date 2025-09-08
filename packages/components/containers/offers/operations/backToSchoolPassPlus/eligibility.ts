import type { Subscription } from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';
import { hasPassLifetime, hasPassViaSimpleLogin } from '@proton/shared/lib/user/helpers';

import OfferSubscription from '../../helpers/offerSubscription';
import type { OfferConfig } from '../../interface';

interface Props {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    offerConfig: OfferConfig;
}

export const getIsEligible = ({ user, subscription, protonConfig }: Props) => {
    if (user.isDelinquent || !user.canPay || user.isPaid || subscription?.UpcomingSubscription) {
        return false;
    }

    if (subscription) {
        const offerSubscription = new OfferSubscription(subscription);
        if (offerSubscription.usedBackToSchoolPromo()) {
            return false;
        }
    }

    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const hasValidApp =
        protonConfig.APP_NAME === APPS.PROTONPASS ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONPASS);
    if (hasValidApp && !hasPassLifetime(user) && !hasPassViaSimpleLogin(user)) {
        return true;
    }

    return false;
};
