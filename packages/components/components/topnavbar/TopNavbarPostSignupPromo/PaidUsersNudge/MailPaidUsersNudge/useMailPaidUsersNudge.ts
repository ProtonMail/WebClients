import { useSubscription } from '@proton/account/subscription/hooks';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { PLANS } from '@proton/payments/index';
import { domIsBusy } from '@proton/shared/lib/busy';
import { APPS } from '@proton/shared/lib/constants';

import { type OfferHookReturnValue } from '../../common/interface';
import { shouldOpenReminder } from '../components/paidUserNudgeHelper';
import { useMonthlyUpsellEligibility } from '../helpers/useMonthlyUpsellEligibility';

export const useMailPaidUsersNudge = (): OfferHookReturnValue => {
    const [subscription, subscriptionLoading] = useSubscription();

    const { feature } = useFeature<number>(FeatureCode.MailPaidUserNudgeTimestamp);

    const isEligible = useMonthlyUpsellEligibility({
        eligiblePlan: PLANS.MAIL,
        allowedApps: new Set<string>([APPS.PROTONMAIL, APPS.PROTONCALENDAR]),
        offerFlag: 'SubscriberNudgeMailMonthly',
        offerTimestampFlag: FeatureCode.MailPaidUserNudgeTimestamp,
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
