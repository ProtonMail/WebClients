import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import { FeatureCode, useFeature } from '@proton/features';

import { type PostSubscriptionOneDollarOfferState } from '../PostSignupOneDollar/interface';
import { getIsUserEligibleForSubscriptionReminder } from './mailSubscriptionReminderHelper';

export const useMailSubscriptionReminder = () => {
    const protonConfig = useConfig();
    const [user, userLoading] = useUser();

    const { feature: mailOfferState, loading: postSignupDateLoading } = useFeature<PostSubscriptionOneDollarOfferState>(
        FeatureCode.MailPostSignupOneDollarState
    );
    const { feature: lastReminderDate, loading: lastReminderDateLoading } = useFeature(
        FeatureCode.SubscriptionLastReminderDate
    );

    return {
        isEligible: getIsUserEligibleForSubscriptionReminder({
            user,
            protonConfig,
            mailOfferState: mailOfferState?.Value,
            lastReminderTimestamp: lastReminderDate?.Value,
        }),
        loading: userLoading || lastReminderDateLoading || postSignupDateLoading,
    };
};
