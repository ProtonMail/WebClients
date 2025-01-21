import { useLocation } from 'react-router';

import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import { FeatureCode, useFeature } from '@proton/features';
import { useMessageCounts } from '@proton/mail/counts';
import { domIsBusy } from '@proton/shared/lib/busy';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash';

import type { PostSubscriptionOneDollarOfferState } from '../components/interface';
import { shouldOpenPostSignupOffer } from '../components/postSignupOffersHelpers';
import { getIsUserEligibleForOneDollar } from './mailPostSignupOneDollarHelper';

export const useMailPostSignupOneDollar = () => {
    const protonConfig = useConfig();
    const [user, userLoading] = useUser();

    // The offer should not be opened if the user has selected a conversation / message.
    // Only when in the root of a folder, regardless of the folder
    const { pathname } = useLocation();
    const isInFolder = pathname.slice(1, pathname.length).split('/').length === 1;

    const [messageCount, loadingMessageCount] = useMessageCounts();
    const totalMessage = messageCount?.find((label) => label.LabelID === MAILBOX_LABEL_IDS.ALL_MAIL)?.Total || 0;

    // One flag to control the feature, and another to manage the progressive rollout of existing users
    const mailOneDollarPostSignupFlag = useFlag('MailPostSignupOneDollarPromo');

    // One flag to store the state of the offer and the different modals, and another to manage the progressive rollout
    const { feature: mailOfferState, loading: postSignupDateLoading } = useFeature<PostSubscriptionOneDollarOfferState>(
        FeatureCode.MailPostSignupOneDollarState
    );
    const { feature: postSignupThreshold, loading: postSignupThresholdLoading } = useFeature(
        FeatureCode.MailPostSignupOneDollarAccountAge
    );

    const isDomBusy = domIsBusy();

    return {
        isEligible: getIsUserEligibleForOneDollar({
            user,
            protonConfig,
            postSignupTimestamp: mailOfferState?.Value?.offerStartDate ?? 0,
            postSignupThreshold: postSignupThreshold?.Value,
            mailOneDollarPostSignupFlag,
            totalMessage,
        }),
        loading: userLoading || postSignupDateLoading || postSignupThresholdLoading || loadingMessageCount,
        openSpotlight: isInFolder && shouldOpenPostSignupOffer(mailOfferState?.Value) && !isDomBusy,
    };
};
