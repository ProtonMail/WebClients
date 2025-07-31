import { differenceInDays, fromUnixTime } from 'date-fns';

import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';
import { hasPassLifetime } from '@proton/shared/lib/user/helpers';

import {
    POST_SIGNUP_ONE_DOLLAR_ACCOUNT_AGE,
    POST_SIGNUP_ONE_DOLLAR_DURATION,
    type PostSubscriptionOneDollarOfferState,
} from '../interface';

interface Props {
    user: UserModel;
    protonConfig: ProtonConfig;
    offerStartDateTimestamp: number;
    driveOneDollarPostSignupFlag: boolean;
    lastSubscriptionEnd: number;
    mailOfferStartDateTimestamp?: PostSubscriptionOneDollarOfferState;
    hasUploadedFile: boolean;
}

export const getIsUserEligibleForOneDollar = ({
    user,
    protonConfig,
    offerStartDateTimestamp: postSignupTimestamp,
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

    const accountCreationDate = fromUnixTime(user.CreateTime);
    const offerExpirationDate = fromUnixTime(postSignupTimestamp);

    // Account must be created 3 days ago to be eligible
    const isAccountOldEnough = differenceInDays(today, accountCreationDate) >= POST_SIGNUP_ONE_DOLLAR_ACCOUNT_AGE;

    // The offer is valid for 30 days after the first time it was shown to the user
    const isOfferStillValid =
        !postSignupTimestamp || differenceInDays(today, offerExpirationDate) <= POST_SIGNUP_ONE_DOLLAR_DURATION;

    const basicEligibility =
        user.isFree && !user.isDelinquent && hasValidApp && !lastSubscriptionEnd && !hasPassLifetime(user);

    return basicEligibility && hasUploadedFile && isOfferStillValid && isAccountOldEnough;
};
