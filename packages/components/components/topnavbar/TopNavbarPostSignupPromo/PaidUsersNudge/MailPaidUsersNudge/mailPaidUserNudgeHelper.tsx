import { differenceInDays, fromUnixTime } from 'date-fns';

import { CYCLE, PLANS } from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import { isManagedExternally } from '@proton/shared/lib/helpers/subscription';
import type { ProtonConfig, Subscription } from '@proton/shared/lib/interfaces';

import { isInWindow } from '../components/paidUserNudgeHelper';

interface Props {
    config: ProtonConfig;
    flag: boolean;
    subscription: Subscription;
    hideOffer?: boolean;
}

const allowedApp = new Set<string>([APPS.PROTONMAIL, APPS.PROTONCALENDAR]);

export const getIsElligibleForNudge = ({ flag, config, subscription, hideOffer }: Props) => {
    if (hideOffer || !flag) {
        return false;
    }

    const parentApp = getAppFromPathnameSafe(window.location.pathname);

    const isValidApp =
        allowedApp.has(config?.APP_NAME) || (config.APP_NAME === APPS.PROTONACCOUNT && allowedApp.has(parentApp ?? ''));

    // The user must have a monthly subscription
    const isMonthlyBilled = subscription?.Cycle === CYCLE.MONTHLY;
    // The upcoming subscription should not be yearly since this means the user already used the promotion
    const isNextSubscriptionYearly = subscription.UpcomingSubscription?.Cycle === CYCLE.YEARLY;

    const isMailPlus = subscription.Plans?.some(({ Name }) => Name === PLANS.MAIL);

    const subscriptionAge = differenceInDays(Date.now(), fromUnixTime(subscription.PeriodStart));

    const isSubscriptionInEligibilityWindow = isInWindow(subscriptionAge);
    const isMobile = isManagedExternally(subscription);

    return (
        isValidApp &&
        isMonthlyBilled &&
        isMailPlus &&
        isSubscriptionInEligibilityWindow &&
        !isMobile &&
        !isNextSubscriptionYearly
    );
};
