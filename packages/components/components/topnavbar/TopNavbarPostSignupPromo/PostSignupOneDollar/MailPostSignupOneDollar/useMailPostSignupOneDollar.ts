import { useLocation } from 'react-router';

import { usePreviousSubscription } from '@proton/account/previousSubscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { FeatureCode, useFeature } from '@proton/features';
import { domIsBusy } from '@proton/shared/lib/busy';
import { useFlag } from '@proton/unleash/useFlag';

import type { OfferHookReturnValue } from '../../common/helpers/interface';
import { isRootFolder } from '../../common/topNavbarPromoHelpers';
import type { PostSubscriptionOneDollarOfferState } from '../interface';
import { shouldOpenPostSignupOffer } from '../postSignupOffersHelpers';
import { getIsUserEligibleForOneDollar } from './mailPostSignupOneDollarHelper';

export const useMailPostSignupOneDollar = (): OfferHookReturnValue => {
    const protonConfig = useConfig();
    const [user, userLoading] = useUser();

    const [{ hasHadSubscription }, loadingPreviousSubscription] = usePreviousSubscription();

    // The offer should not be opened if the user has selected a conversation / message.
    // Only when in the root of a folder, regardless of the folder
    const { pathname } = useLocation();
    const isNotInFolder = isRootFolder(pathname);

    const mailPostSignupOneDollarPromoDisabled = useFlag('MailPostSignupOneDollarPromoDisabled');

    // One flag to store the state of the offer and the different modals, and another to manage the progressive rollout
    const { feature: mailOfferState, loading: mailOfferStateLoading } = useFeature<PostSubscriptionOneDollarOfferState>(
        FeatureCode.MailPostSignupOneDollarState
    );
    const { feature: driveOfferState, loading: driveOfferStateLoading } =
        useFeature<PostSubscriptionOneDollarOfferState>(FeatureCode.DrivePostSignupOneDollarState);

    const isDomBusy = domIsBusy();

    return {
        isEligible: getIsUserEligibleForOneDollar({
            user,
            protonConfig,
            offerStartDateTimeStamp: mailOfferState?.Value?.offerStartDate ?? 0,
            mailPostSignupOneDollarPromoDisabled,
            hasHadSubscription,
            driveOfferStartDateTimestamp: driveOfferState?.Value,
        }),
        isLoading: !!(userLoading || mailOfferStateLoading || driveOfferStateLoading || loadingPreviousSubscription),
        openSpotlight: isNotInFolder && shouldOpenPostSignupOffer(mailOfferState?.Value) && !isDomBusy,
    };
};
