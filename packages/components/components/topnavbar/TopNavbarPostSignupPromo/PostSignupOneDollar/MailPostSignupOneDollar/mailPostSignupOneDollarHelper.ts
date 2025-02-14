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
    offerStartDateTimeStamp: number;
    minimalAccountAgeTimestamp: number;
    mailOneDollarPostSignupFlag: boolean;
    nbrEmailsInAllMail: number;
    lastSubscriptionEnd: number;
    driveOfferStartDateTimestamp?: PostSubscriptionOneDollarOfferState;
}

const POST_SIGNUP_REQUIRED_EMAILS = 10 as const;

export const getIsUserEligibleForOneDollar = ({
    user,
    protonConfig,
    offerStartDateTimeStamp,
    minimalAccountAgeTimestamp,
    mailOneDollarPostSignupFlag,
    nbrEmailsInAllMail,
    lastSubscriptionEnd,
    driveOfferStartDateTimestamp,
}: Props) => {
    // Global offer flag
    if (!mailOneDollarPostSignupFlag) {
        return false;
    }

    const hasValidApp = protonConfig.APP_NAME === APPS.PROTONMAIL;

    const today = new Date();

    // We don't want to run the offer if the drive offer is running
    const isDriveOfferRunning =
        differenceInDays(today, fromUnixTime(driveOfferStartDateTimestamp?.offerStartDate || 0)) <=
        POST_SIGNUP_ONE_DOLLAR_DURATION;
    if (isDriveOfferRunning) {
        return false;
    }

    const postSignupThresholdDate = fromUnixTime(minimalAccountAgeTimestamp);
    const accountCreationDate = fromUnixTime(user.CreateTime);
    const offerExpirationDate = fromUnixTime(offerStartDateTimeStamp);

    // Accounts must be created after the signup threshold date (controlled by feature flag)
    const isAccountCreatedAfterThreshold = isAfter(accountCreationDate, postSignupThresholdDate);

    // Account must be created 7 days ago to be eligible
    const isAccountOldEnough = differenceInDays(today, accountCreationDate) >= POST_SIGNUP_ONE_DOLLAR_ACCOUNT_AGE;

    // The offer is valid for 30 days after the first time it was shown to the user
    const isOfferStillValid =
        !offerStartDateTimeStamp || differenceInDays(today, offerExpirationDate) <= POST_SIGNUP_ONE_DOLLAR_DURATION;

    // We consider the user has the required mail if the offer already started
    const hasRequiredEmails = offerStartDateTimeStamp ? true : nbrEmailsInAllMail >= POST_SIGNUP_REQUIRED_EMAILS;
    const basicEligibility =
        user.isFree && !user.isDelinquent && hasValidApp && hasRequiredEmails && !lastSubscriptionEnd;

    return isAccountCreatedAfterThreshold && basicEligibility && isOfferStillValid && isAccountOldEnough;
};
