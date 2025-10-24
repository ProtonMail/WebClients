import { fromUnixTime, isBefore } from 'date-fns';

import { type Subscription, canModify } from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import isSubscriptionCheckAllowed from '../../helpers/isSubscriptionCheckAllowed';
import { FREE_DOWNGRADER_LIMIT } from '../../helpers/offerPeriods';
import OfferSubscription from '../../helpers/offerSubscription';
import type { OfferConfig } from '../../interface';

interface Props {
    protonConfig: ProtonConfig;
    user: UserModel;
    previousSubscriptionEndTime: number;
    subscription?: Subscription;
    offerConfig: OfferConfig;
}

export const getIsEligible = ({
    user,
    protonConfig,
    previousSubscriptionEndTime = 0,
    subscription,
    offerConfig,
}: Props) => {
    if (!subscription) {
        return false;
    }

    const parentApp = getAppFromPathnameSafe(window.location.pathname);
    const hasValidApp =
        protonConfig.APP_NAME === APPS.PROTONMAIL ||
        protonConfig.APP_NAME === APPS.PROTONCALENDAR ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONMAIL) ||
        (protonConfig.APP_NAME === APPS.PROTONACCOUNT && parentApp === APPS.PROTONCALENDAR);
    const subscriptionCheckAllowed = isSubscriptionCheckAllowed(subscription, offerConfig);

    if (user.isPaid) {
        const offerSubscription = new OfferSubscription(subscription);
        const canModifySubscription = canModify(subscription);
        const hasMailMonthly = offerSubscription.hasMail() && offerSubscription.hasMonthlyCycle();

        return (
            hasValidApp &&
            subscriptionCheckAllowed &&
            hasMailMonthly &&
            canModifySubscription &&
            user.canPay &&
            !user.isDelinquent
        );
    }

    return (
        hasValidApp &&
        subscriptionCheckAllowed &&
        isBefore(fromUnixTime(previousSubscriptionEndTime), FREE_DOWNGRADER_LIMIT) &&
        user.canPay &&
        !user.isDelinquent
    );
};
