import { fromUnixTime, isBefore } from 'date-fns';

import { type Subscription, canModify } from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';
import { hasPassLifetime, hasPassViaSimpleLogin } from '@proton/shared/lib/user/helpers';

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
        protonConfig.APP_NAME === APPS.PROTONPASS ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONPASS);
    const noPassViaSimpleLogin = !hasPassViaSimpleLogin(user);
    const noPassLifetime = !hasPassLifetime(user);
    const checkAllowed = isCheckAllowed(subscription, offerConfig);

    if (user.isPaid) {
        const offerSubscription = new OfferSubscription(subscription);
        const canModifySubscription = canModify(subscription);
        const hasPassMonthly = offerSubscription.hasPass() && offerSubscription.isMonthly();

        return (
            hasValidApp &&
            checkAllowed &&
            hasPassMonthly &&
            canModifySubscription &&
            noPassLifetime &&
            noPassViaSimpleLogin &&
            user.canPay &&
            !user.isDelinquent
        );
    }

    return (
        hasValidApp &&
        checkAllowed &&
        isBefore(fromUnixTime(previousSubscriptionEndTime), FREE_DOWNGRADER_LIMIT) &&
        noPassLifetime &&
        noPassViaSimpleLogin &&
        user.canPay &&
        !user.isDelinquent
    );
};
