import { useSubscription } from '@proton/account/subscription/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { domIsBusy } from '@proton/shared/lib/busy';
import useFlag from '@proton/unleash/useFlag';

import { type OfferHookReturnValue } from '../../common/interface';
import { HIDE_OFFER } from '../components/interface';
import { shouldOpenReminder } from '../components/paidUserNudgeHelper';
import { getIsElligibleForNudge } from './mailPaidUserNudgeHelper';

export const useMailPaidUsersNudge = (): OfferHookReturnValue => {
    const protonConfig = useConfig();
    const [subscription, subscriptionLoading] = useSubscription();

    // One flag to control the offer
    const mailMonthlynudge = useFlag('SubscriberNudgeMailMonthly');

    const { feature } = useFeature<number>(FeatureCode.MailPaidUserNudgeTimestamp);

    if (!subscription) {
        return {
            isLoading: false,
            isEligible: false,
            openSpotlight: false,
        };
    }

    const shouldShowReminder = shouldOpenReminder(subscription.PeriodStart, feature?.Value ?? 0);
    const isDomBusy = domIsBusy();

    return {
        isEligible: getIsElligibleForNudge({
            config: protonConfig,
            flag: mailMonthlynudge,
            subscription,
            hideOffer: feature?.Value === HIDE_OFFER,
        }),
        isLoading: subscriptionLoading,
        openSpotlight: !isDomBusy && shouldShowReminder,
    };
};
