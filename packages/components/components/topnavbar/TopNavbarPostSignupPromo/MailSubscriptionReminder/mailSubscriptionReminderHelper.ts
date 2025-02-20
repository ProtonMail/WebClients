import { differenceInDays, fromUnixTime } from 'date-fns';

import { domIsBusy } from '@proton/shared/lib/busy';
import { APPS } from '@proton/shared/lib/constants';
import type { ProtonConfig, UserModel } from '@proton/shared/lib/interfaces';

import {
    POST_SIGNUP_ONE_DOLLAR_DURATION,
    type PostSubscriptionOneDollarOfferState,
} from '../PostSignupOneDollar/interface';

interface Props {
    user: UserModel;
    protonConfig: ProtonConfig;
    mailOfferState?: PostSubscriptionOneDollarOfferState;
    lastReminderTimestamp?: number;
}

const PROMOTION_BUFFER_DAYS = 14;
const REMINDER_INTERVAL_DAYS = 90;

export const getIsUserEligibleForSubscriptionReminder = ({
    user,
    protonConfig,
    mailOfferState,
    lastReminderTimestamp,
}: Props) => {
    const { isFree, isDelinquent } = user;
    const isNotDelinquent = !isDelinquent;
    const hasValidApp = protonConfig.APP_NAME === APPS.PROTONMAIL;

    const today = new Date();

    const daysSinceOneDollarOffer = mailOfferState?.offerStartDate
        ? differenceInDays(today, fromUnixTime(mailOfferState?.offerStartDate))
        : 0;

    const lastReminderDate = lastReminderTimestamp ? fromUnixTime(lastReminderTimestamp) : today;
    const daysSinceLastReminder = differenceInDays(today, lastReminderDate);

    // We display the reminder every 90 days (three month)
    const displaySixMonthReminder = daysSinceLastReminder >= REMINDER_INTERVAL_DAYS;

    // We want to display the offer if the one-dollar promo was finished more than 14 days ago
    const shouldDisplayOffer = lastReminderTimestamp
        ? displaySixMonthReminder
        : daysSinceOneDollarOffer >= POST_SIGNUP_ONE_DOLLAR_DURATION + PROMOTION_BUFFER_DAYS;

    const isDomBusy = domIsBusy();

    return isFree && isNotDelinquent && hasValidApp && shouldDisplayOffer && !isDomBusy;
};
