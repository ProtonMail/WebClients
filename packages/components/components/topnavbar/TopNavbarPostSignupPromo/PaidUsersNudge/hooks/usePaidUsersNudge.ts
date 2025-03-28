import { useSubscription } from '@proton/account/subscription/hooks';
import useFeature from '@proton/features/useFeature';
import { domIsBusy } from '@proton/shared/lib/busy';

import { type OfferHookReturnValue } from '../../common/interface';
import type { SupportedPlans } from '../helpers/interface';
import { shouldOpenReminder } from '../helpers/paidUserNudgeHelper';
import { paidConfig } from '../montlyPaidUserNudgeConfig';
import { useMonthlyUpsellEligibility } from './useMonthlyUpsellEligibility';

interface Props {
    plan: SupportedPlans;
}

export const usePaidUsersNudge = ({ plan }: Props): OfferHookReturnValue => {
    const [subscription, subscriptionLoading] = useSubscription();

    const { feature } = useFeature<number>(paidConfig[plan].offerTimestampFlag);

    const isEligible = useMonthlyUpsellEligibility({
        eligiblePlan: paidConfig[plan].currentPlan,
        allowedApps: paidConfig[plan].allowedApps,
        offerFlag: paidConfig[plan].offerFlag,
        offerTimestampFlag: paidConfig[plan].offerTimestampFlag,
    });

    if (!subscription) {
        return {
            isEligible: false,
            isLoading: false,
            openSpotlight: false,
        };
    }

    const shouldShowReminder = shouldOpenReminder(subscription.PeriodStart, feature?.Value ?? 0);
    const isDomBusy = domIsBusy();

    return {
        isEligible,
        isLoading: subscriptionLoading,
        openSpotlight: !isDomBusy && shouldShowReminder,
    };
};
