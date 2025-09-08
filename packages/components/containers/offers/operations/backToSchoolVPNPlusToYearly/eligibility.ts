import { CYCLE, PLANS, type Subscription } from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import OfferSubscription from '../../helpers/offerSubscription';
import type { OfferConfig } from '../../interface';

interface Props {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    offerConfig: OfferConfig;
}

export const getIsEligible = ({ user, subscription, protonConfig }: Props) => {
    if (user.isDelinquent || !user.canPay || user.isFree || subscription?.UpcomingSubscription) {
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
        protonConfig.APP_NAME === APPS.PROTONVPN_SETTINGS ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONVPN_SETTINGS);
    const vpnSubscription = subscription?.Plans?.find((plan) => plan.Name === PLANS.VPN2024);
    if (hasValidApp && vpnSubscription?.Cycle === CYCLE.MONTHLY) {
        return true;
    }

    return false;
};
