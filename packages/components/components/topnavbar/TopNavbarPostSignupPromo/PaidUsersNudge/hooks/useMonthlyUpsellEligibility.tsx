import { differenceInDays, fromUnixTime } from 'date-fns';

import { useSubscription } from '@proton/account/subscription/hooks';
import type { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { CYCLE, type PLANS } from '@proton/payments/core/constants';
import { canModify, hasMigrationDiscount } from '@proton/payments/core/subscription/helpers';
import { isPaidSubscription } from '@proton/payments/core/type-guards';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';
import type { FeatureFlag } from '@proton/unleash/Flags';
import { useFlag } from '@proton/unleash/useFlag';

import useConfig from '../../../../../hooks/useConfig';
import { HIDE_OFFER } from '../helpers/interface';
import { isInWindow } from '../helpers/paidUserNudgeHelper';

interface Props {
    eligiblePlan: PLANS;
    allowedApps: Set<string>;
    offerDisabledFlag: FeatureFlag;
    offerTimestampFlag: FeatureCode;
}

export const useMonthlyUpsellEligibility = ({
    eligiblePlan,
    allowedApps,
    offerDisabledFlag,
    offerTimestampFlag,
}: Props): boolean => {
    const config = useConfig();
    const [subscription] = useSubscription();
    const isNudgeDisabled = useFlag(offerDisabledFlag);

    const { feature } = useFeature<number>(offerTimestampFlag);

    if (feature?.Value === HIDE_OFFER || isNudgeDisabled || !subscription) {
        return false;
    }

    const parentApp = getAppFromPathnameSafe(window.location.pathname);

    const isValidApp =
        allowedApps.has(config?.APP_NAME) ||
        (config?.APP_NAME === APPS.PROTONACCOUNT && allowedApps.has(parentApp ?? ''));

    const isMonthlyBilled = subscription?.Cycle === CYCLE.MONTHLY;
    const isNextSubscriptionYearly = subscription.UpcomingSubscription?.Cycle === CYCLE.YEARLY;

    const isEligiblePlan = !!subscription.Plans?.some(({ Name }) => Name === eligiblePlan);
    const isMigratedUser = hasMigrationDiscount(subscription);

    const canModifySubscription = canModify(subscription);
    const isInEligbilityWindow =
        isPaidSubscription(subscription) &&
        isInWindow(differenceInDays(Date.now(), fromUnixTime(subscription.PeriodStart)));

    return (
        isValidApp &&
        isMonthlyBilled &&
        isEligiblePlan &&
        isInEligbilityWindow &&
        canModifySubscription &&
        !isMigratedUser &&
        !isNextSubscriptionYearly
    );
};
