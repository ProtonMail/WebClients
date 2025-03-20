import { differenceInDays, fromUnixTime } from 'date-fns';

import { useSubscription } from '@proton/account/subscription/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import { type FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { CYCLE, type PLANS } from '@proton/payments';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import { isManagedExternally } from '@proton/shared/lib/helpers/subscription';
import type { FeatureFlag } from '@proton/unleash/UnleashFeatureFlags';
import useFlag from '@proton/unleash/useFlag';

import { HIDE_OFFER } from '../components/interface';
import { isInWindow } from '../components/paidUserNudgeHelper';

interface Props {
    eligiblePlan: PLANS;
    allowedApps: Set<string>;
    offerFlag: FeatureFlag;
    offerTimestampFlag: FeatureCode;
}

export const useMonthlyUpsellEligibility = ({ eligiblePlan, allowedApps, offerFlag, offerTimestampFlag }: Props) => {
    const config = useConfig();
    const [subscription] = useSubscription();
    const flag = useFlag(offerFlag);

    const { feature } = useFeature<number>(offerTimestampFlag);

    if (feature?.Value === HIDE_OFFER || !flag || !subscription) {
        return false;
    }

    const parentApp = getAppFromPathnameSafe(window.location.pathname);

    const isValidApp =
        allowedApps.has(config?.APP_NAME) ||
        (config?.APP_NAME === APPS.PROTONACCOUNT && allowedApps.has(parentApp ?? ''));

    const isMonthlyBilled = subscription?.Cycle === CYCLE.MONTHLY;
    const isNextSubscriptionYearly = subscription.UpcomingSubscription?.Cycle === CYCLE.YEARLY;

    const isEligiblePlan = subscription.Plans?.some(({ Name }) => Name === eligiblePlan);

    const isMobileSubscriber = isManagedExternally(subscription);
    const isInEligbilityWindow = isInWindow(differenceInDays(Date.now(), fromUnixTime(subscription.PeriodStart)));

    return (
        isValidApp &&
        isMonthlyBilled &&
        isEligiblePlan &&
        isInEligbilityWindow &&
        !isMobileSubscriber &&
        !isNextSubscriptionYearly
    );
};
