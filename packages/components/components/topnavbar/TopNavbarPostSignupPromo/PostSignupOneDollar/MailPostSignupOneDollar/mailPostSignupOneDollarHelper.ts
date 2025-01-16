import { differenceInDays, fromUnixTime, isAfter } from 'date-fns';

import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

interface Props {
    user: UserModel;
    protonConfig: ProtonConfig;
    postSignupTimestamp: number;
    postSignupThreshold: number;
    mailOneDollarPostSignupFlag: boolean;
}

const POST_SIGNUP_ONE_DOLLAR_ACCOUNT_AGE = 7;
export const POST_SIGNUP_ONE_DOLLAR_DURATION = 30;

export const getIsUserEligibleForOneDollar = ({
    user,
    protonConfig,
    postSignupTimestamp,
    postSignupThreshold,
    mailOneDollarPostSignupFlag,
}: Props) => {
    // Global offer flag
    if (!mailOneDollarPostSignupFlag) {
        return false;
    }

    const hasValidApp = protonConfig.APP_NAME === APPS.PROTONMAIL;

    const today = new Date();
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

    const basicEligibility = user.isFree && !user.isDelinquent && hasValidApp;

    return isAccountCreatedAfterThreshold && basicEligibility && isOfferStillValid && isAccountOldEnough;
};
