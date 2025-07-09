import { differenceInDays, fromUnixTime } from 'date-fns';

import OfferSubscription from '@proton/components/containers/offers/helpers/offerSubscription';
import { type Subscription, isManagedExternally } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';
import { hasPassLifetime } from '@proton/shared/lib/user/helpers';

import { POST_SIGNUP_GO_UNLIMITED_ACCOUNT_AGE } from './interface';

interface Props {
    user: UserModel;
    subscription?: Subscription;
    protonConfig: ProtonConfig;
    parentApp?: (typeof APPS)[keyof typeof APPS];
}

export const getIsEligible = ({ user, subscription, protonConfig, parentApp }: Props) => {
    if (!subscription) {
        return false;
    }

    const isValidApp =
        protonConfig?.APP_NAME === APPS.PROTONMAIL ||
        protonConfig?.APP_NAME === APPS.PROTONCALENDAR ||
        protonConfig?.APP_NAME === APPS.PROTONDRIVE ||
        (protonConfig?.APP_NAME === APPS.PROTONACCOUNT &&
            (parentApp === APPS.PROTONMAIL || parentApp === APPS.PROTONDRIVE || parentApp === APPS.PROTONCALENDAR));

    const isWebSubscription = !isManagedExternally(subscription);

    const offerSubscription = new OfferSubscription(subscription);
    const isEligibleCycle = offerSubscription.isYearly() || offerSubscription.isTwoYears();
    const hasEligiblePlan = offerSubscription.hasMail() || offerSubscription.hasDrive();

    const hasNoScheduledSubscription = !subscription?.UpcomingSubscription;

    const subscriptionCreateTime = subscription?.CreateTime ? fromUnixTime(subscription.CreateTime) : new Date();
    const daysSinceSubscription = subscriptionCreateTime ? differenceInDays(new Date(), subscriptionCreateTime) : 0;

    const shouldShow = daysSinceSubscription >= POST_SIGNUP_GO_UNLIMITED_ACCOUNT_AGE;

    return (
        isValidApp &&
        isWebSubscription &&
        isEligibleCycle &&
        hasEligiblePlan &&
        hasNoScheduledSubscription &&
        shouldShow &&
        !hasPassLifetime(user) &&
        user.canPay &&
        !user.isDelinquent
    );
};
