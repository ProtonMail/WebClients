import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import { FeatureCode, useFeature } from '@proton/features';

import { type PostSubscriptionOneDollarOfferState } from '../PostSignupOneDollar/interface';
import { type OfferHookReturnValue } from '../common/interface';
import { getIsUserEligibleForSubscriptionReminder } from './mailSubscriptionReminderHelper';

export const useMailSubscriptionReminder = (): OfferHookReturnValue => {
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
        isLoading: !!(userLoading || lastReminderDateLoading || postSignupDateLoading),
        openSpotlight: false,
    };
};
