import { usePreviousSubscription } from '@proton/account/previousSubscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import { FeatureCode, useFeature } from '@proton/features';
import { domIsBusy } from '@proton/shared/lib/busy';
import useFlag from '@proton/unleash/useFlag';

import { type OfferHookReturnValue } from '../../common/interface';
import { type PostSubscriptionOneDollarOfferState } from '../interface';
import { shouldOpenPostSignupOffer } from '../postSignupOffersHelpers';
import { getIsUserEligibleForOneDollar } from './drivePostSignupOneDollarHelper';

export const useDrivePostSignupOneDollar = (): OfferHookReturnValue => {
    const protonConfig = useConfig();
    const [user, loadingUser] = useUser();

    const [{ previousSubscriptionEndTime }, loadingPreviousSubscription] = usePreviousSubscription();

    // One flag to control the feature, and another to manage the progressive rollout of existing users
    const driveOneDollarPostSignupFlag = useFlag('DrivePostSignupOneDollarPromo');

    // One flag to store the state of the offer and the different modals, and another to manage the progressive rollout
    const { feature: driveOfferState, loading: postSignupDateLoading } =
        useFeature<PostSubscriptionOneDollarOfferState>(FeatureCode.DrivePostSignupOneDollarState);
    const { feature: mailOfferState, loading: mailOfferLoading } = useFeature<PostSubscriptionOneDollarOfferState>(
        FeatureCode.MailPostSignupOneDollarState
    );

    const isDomBusy = domIsBusy();

    return {
        isEligible: getIsUserEligibleForOneDollar({
            user,
            protonConfig,
            offerStartDateTimestamp: driveOfferState?.Value?.offerStartDate ?? 0,
            driveOneDollarPostSignupFlag,
            previousSubscriptionEndTime,
            mailOfferStartDateTimestamp: mailOfferState?.Value,
            hasUploadedFile: !!(user?.ProductUsedSpace?.Drive ?? 0 > 0),
        }),
        isLoading: loadingUser || postSignupDateLoading || mailOfferLoading || loadingPreviousSubscription,
        openSpotlight: shouldOpenPostSignupOffer(driveOfferState?.Value) && !isDomBusy,
    };
};
