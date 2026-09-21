import { differenceInDays, differenceInHours, fromUnixTime } from 'date-fns';

import type { FreeSubscription } from '@proton/payments/core/interface';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import {
    checkAppIsValid,
    checksAllPass,
    hasNoScheduledSubscription,
    noPassLifetime,
    userCanPay,
    userNotDelinquent,
} from '../common/helpers/eligibilityChecks';
import { ZERO_NINETY_NINE_ACCOUNT_AGE_HOURS, ZERO_NINETY_NINE_DURATION } from './interface';

interface Props {
    user: UserModel;
    subscription?: Subscription | FreeSubscription;
    protonConfig: ProtonConfig;
    parentApp?: (typeof APPS)[keyof typeof APPS];
    offerStartDateTimeStamp: number;
}

export const getIsUserEligibleForZeroNinetyNine = ({
    user,
    subscription,
    protonConfig,
    parentApp,
    offerStartDateTimeStamp,
}: Props) => {
    const today = new Date();
    const accountCreationDate = fromUnixTime(user.CreateTime);

    // Account must be created 5 hours ago to be eligible
    const isAccountOldEnough = differenceInHours(today, accountCreationDate) >= ZERO_NINETY_NINE_ACCOUNT_AGE_HOURS;

    // The offer is valid for 30 days after the first time it was shown to the user
    const isOfferStillValid =
        !offerStartDateTimeStamp ||
        differenceInDays(new Date(), fromUnixTime(offerStartDateTimeStamp)) <= ZERO_NINETY_NINE_DURATION;

    return checksAllPass(
        user.isFree,
        userCanPay(user),
        userNotDelinquent(user),
        noPassLifetime(user),
        hasNoScheduledSubscription(subscription),
        checkAppIsValid([APPS.PROTONMAIL], protonConfig, parentApp),
        isAccountOldEnough,
        isOfferStillValid
    );
};
