import { differenceInDays, fromUnixTime, isAfter } from 'date-fns';

import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import {
    POST_SIGNUP_ONE_DOLLAR_ACCOUNT_AGE,
    POST_SIGNUP_ONE_DOLLAR_DURATION,
    type PostSubscriptionOneDollarOfferState,
} from '../interface';

interface Props {
    user: UserModel;
    protonConfig: ProtonConfig;
    offerStartDateTimestamp: number;
    minimalAccountAgeTimestamp: number;
    driveOneDollarPostSignupFlag: boolean;
    lastSubscriptionEnd: number;
    mailOfferStartDateTimestamp?: PostSubscriptionOneDollarOfferState;
    hasUploadedFile: boolean;
}

export const getIsUserEligibleForOneDollar = ({
    user,
    protonConfig,
    offerStartDateTimestamp: postSignupTimestamp,
    minimalAccountAgeTimestamp: postSignupThreshold,
    driveOneDollarPostSignupFlag,
    lastSubscriptionEnd,
    mailOfferStartDateTimestamp: mailOfferState,
    hasUploadedFile,
}: Props) => {
    // Global offer flag
    if (!driveOneDollarPostSignupFlag) {
        return false;
    }

    const hasValidApp = protonConfig.APP_NAME === APPS.PROTONDRIVE;

    const today = new Date();

    // We don't want to run the offer if the mail offer is running
    const isMailOfferRunning =
        differenceInDays(today, fromUnixTime(mailOfferState?.offerStartDate || 0)) <= POST_SIGNUP_ONE_DOLLAR_DURATION;
    if (isMailOfferRunning) {
        return false;
    }

    const postSignupThresholdDate = fromUnixTime(postSignupThreshold);
    const accountCreationDate = fromUnixTime(user.CreateTime);
    const offerExpirationDate = fromUnixTime(postSignupTimestamp);

    // Accounts must be created after the signup threshold date (controlled by feature flag)
    const isAccountCreatedAfterThreshold = isAfter(accountCreationDate, postSignupThresholdDate);

    // Account must be created 7 days ago to be eligible
    const isAccountOldEnough = differenceInDays(today, accountCreationDate) >= POST_SIGNUP_ONE_DOLLAR_ACCOUNT_AGE;

    // The offer is valid for 30 days after the first time it was shown to the user
    const isOfferStillValid =
        !postSignupTimestamp || differenceInDays(today, offerExpirationDate) <= POST_SIGNUP_ONE_DOLLAR_DURATION;

    const basicEligibility = user.isFree && !user.isDelinquent && hasValidApp && !lastSubscriptionEnd;

    return (
        basicEligibility && hasUploadedFile && isAccountCreatedAfterThreshold && isOfferStillValid && isAccountOldEnough
    );
};
