import { fromUnixTime, isBefore } from 'date-fns';

import { type Subscription } from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import isCheckAllowed from '../../helpers/isCheckAllowed';
import { FREE_DOWNGRADER_LIMIT } from '../../helpers/offerPeriods';
import { type OfferConfig } from '../../interface';

interface Props {
    protonConfig: ProtonConfig;
    user: UserModel;
    previousSubscriptionEndTime: number;
    offerConfig: OfferConfig;
    subscription?: Subscription;
}

export const getIsEligible = ({
    user,
    protonConfig,
    previousSubscriptionEndTime = 0,
    offerConfig,
    subscription,
}: Props) => {
    if (!subscription) {
        return false;
    }

    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const hasValidApp =
        protonConfig.APP_NAME === APPS.PROTONDRIVE ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONDRIVE);

    const checkAllowed = isCheckAllowed(subscription, offerConfig);

    return (
        hasValidApp &&
        checkAllowed &&
        user.isFree &&
        user.canPay &&
        !user.isDelinquent &&
        isBefore(fromUnixTime(previousSubscriptionEndTime), FREE_DOWNGRADER_LIMIT)
    );
};
