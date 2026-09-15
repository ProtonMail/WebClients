import { differenceInDays, differenceInHours, fromUnixTime } from 'date-fns';

import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';
import { hasPassLifetime } from '@proton/shared/lib/user/helpers';

import {
    MAIL_POST_SIGNUP_ONE_DOLLAR_ACCOUNT_AGE,
    POST_SIGNUP_ONE_DOLLAR_DURATION,
    type PostSubscriptionOneDollarOfferState,
} from '../interface';

interface Props {
    user: UserModel;
    protonConfig: ProtonConfig;
    offerStartDateTimeStamp: number;
    mailPostSignupOneDollarPromoDisabled: boolean;
    hasHadSubscription: boolean;
    driveOfferStartDateTimestamp?: PostSubscriptionOneDollarOfferState;
    hasHiddenZeroNinetyNineOffer: boolean;
}

export const getIsUserEligibleForOneDollar = ({
    user,
    protonConfig,
    offerStartDateTimeStamp,
    mailPostSignupOneDollarPromoDisabled,
    hasHadSubscription,
    driveOfferStartDateTimestamp,
    hasHiddenZeroNinetyNineOffer,
}: Props) => {
    if (mailPostSignupOneDollarPromoDisabled) {
        return false;
    }

    // A user who opted out of the temporary 0.99 promo should not be offered the one-dollar
    // offer straight afterwards. Remove this along with the 0.99 promo.
    if (hasHiddenZeroNinetyNineOffer) {
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

    const accountCreationDate = fromUnixTime(user.CreateTime);
    const offerExpirationDate = fromUnixTime(offerStartDateTimeStamp);

    // Account must be created 5 hours ago to be eligible
    const isAccountOldEnough = differenceInHours(today, accountCreationDate) >= MAIL_POST_SIGNUP_ONE_DOLLAR_ACCOUNT_AGE;

    // The offer is valid for 30 days after the first time it was shown to the user
    const isOfferStillValid =
        !offerStartDateTimeStamp || differenceInDays(today, offerExpirationDate) <= POST_SIGNUP_ONE_DOLLAR_DURATION;

    const basicEligibility =
        user.isFree && !user.isDelinquent && hasValidApp && !hasHadSubscription && !hasPassLifetime(user);

    return basicEligibility && isOfferStillValid && isAccountOldEnough;
};
