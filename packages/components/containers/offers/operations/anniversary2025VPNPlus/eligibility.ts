import { fromUnixTime, isBefore } from 'date-fns';

import { type Subscription, canModify } from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import isCheckAllowed from '../../helpers/isCheckAllowed';
import { FREE_DOWNGRADER_LIMIT } from '../../helpers/offerPeriods';
import OfferSubscription from '../../helpers/offerSubscription';
import { type OfferConfig } from '../../interface';

interface Props {
    protonConfig: ProtonConfig;
    user: UserModel;
    previousSubscriptionEndTime: number;
    subscription?: Subscription;
    offerConfig: OfferConfig;
}

export const getIsEligible = ({
    user,
    subscription,
    protonConfig,
    previousSubscriptionEndTime = 0,
    offerConfig,
}: Props) => {
    if (!subscription) {
        return false;
    }

    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const hasValidApp =
        protonConfig.APP_NAME === APPS.PROTONVPN_SETTINGS ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONVPN_SETTINGS);
    const checkAllowed = isCheckAllowed(subscription, offerConfig);

    if (user.isPaid) {
        const offerSubscription = new OfferSubscription(subscription);
        const canModifySubscription = canModify(subscription);
        const hasVPNMonthly =
            (offerSubscription.hasDeprecatedVPN() || offerSubscription.hasVPN2024()) && offerSubscription.isMonthly();

        return (
            hasValidApp && checkAllowed && hasVPNMonthly && canModifySubscription && user.canPay && !user.isDelinquent
        );
    }

    return (
        hasValidApp &&
        checkAllowed &&
        isBefore(fromUnixTime(previousSubscriptionEndTime), FREE_DOWNGRADER_LIMIT) &&
        user.canPay &&
        !user.isDelinquent
    );
};
