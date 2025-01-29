import { useEffect, useState } from 'react';

import { useUserSettings } from '@proton/account/index';
import { useUser } from '@proton/account/user/hooks';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import { FeatureCode, useFeature } from '@proton/features';
import useLoading from '@proton/hooks/useLoading';
import { getDriveChecklist } from '@proton/shared/lib/api/checklist';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { domIsBusy } from '@proton/shared/lib/busy';
import { isDriveUser } from '@proton/shared/lib/helpers/usedClientsFlags';
import { type ChecklistApiResponse, ChecklistKey } from '@proton/shared/lib/interfaces';
import useFlag from '@proton/unleash/useFlag';

import { type PostSubscriptionOneDollarOfferState } from '../interface';
import { shouldOpenPostSignupOffer } from '../postSignupOffersHelpers';
import { getIsUserEligibleForOneDollar } from './drivePostSignupOneDollarHelper';

export const useDrivePostSignupOneDollar = () => {
    const api = useApi();
    const silentAPI = getSilentApi(api);
    const protonConfig = useConfig();
    const [loadingChecklist, withLoading] = useLoading(false);
    const [user, loadingUser] = useUser();
    const [userSettings, loadingUserSettings] = useUserSettings();

    const [checklist, setChecklist] = useState<ChecklistApiResponse>();

    useEffect(() => {
        if (user.isPaid || !isDriveUser(BigInt(userSettings.UsedClientFlags))) {
            return;
        }

        void withLoading(silentAPI<ChecklistApiResponse>(getDriveChecklist('get-started')).then(setChecklist));
    }, [userSettings]);

    const hasUploadedFile = !!checklist?.Items?.includes(ChecklistKey.DriveUpload);

    // One flag to control the feature, and another to manage the progressive rollout of existing users
    const driveOneDollarPostSignupFlag = useFlag('DrivePostSignupOneDollarPromo');

    // One flag to store the state of the offer and the different modals, and another to manage the progressive rollout
    const { feature: driveOfferState, loading: postSignupDateLoading } =
        useFeature<PostSubscriptionOneDollarOfferState>(FeatureCode.DrivePostSignupOneDollarState);
    const { feature: mailOfferState, loading: mailOfferLoading } = useFeature<PostSubscriptionOneDollarOfferState>(
        FeatureCode.MailPostSignupOneDollarState
    );
    const { feature: postSignupThreshold, loading: postSignupThresholdLoading } = useFeature(
        FeatureCode.DrivePostSignupOneDollarAccountAge
    );

    const isDomBusy = domIsBusy();

    return {
        isEligible: getIsUserEligibleForOneDollar({
            user,
            protonConfig,
            offerStartDateTimestamp: driveOfferState?.Value?.offerStartDate ?? 0,
            minimalAccountAgeTimestamp: postSignupThreshold?.Value,
            driveOneDollarPostSignupFlag,
            mailOfferStartDateTimestamp: mailOfferState?.Value,
            hasUploadedFile,
        }),
        loading:
            loadingUser ||
            loadingUserSettings ||
            postSignupDateLoading ||
            postSignupThresholdLoading ||
            mailOfferLoading ||
            loadingChecklist,
        openSpotlight: shouldOpenPostSignupOffer(driveOfferState?.Value) && !isDomBusy,
    };
};
