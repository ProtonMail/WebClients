import { differenceInDays, fromUnixTime } from 'date-fns';

import {
    AUTOMATIC_OFFER_STATE,
    EXTENDED_REMINDER_DAY,
    LAST_REMINDER_DAY,
    type PostSubscriptionOneDollarOfferState,
} from './interface';

/**
 * Returns a boolean that indicate if the user match the requirements to see the one-dollar post-signup offer
 * @param offerState value of the offer feature flag
 */
export const shouldOpenPostSignupOffer = (offerState?: PostSubscriptionOneDollarOfferState) => {
    if (!offerState) {
        return false;
    }

    const { offerStartDate, automaticOfferReminders } = offerState;
    if (!offerStartDate && automaticOfferReminders === AUTOMATIC_OFFER_STATE.notStarted) {
        return true;
    }

    const offerDays = differenceInDays(Date.now(), fromUnixTime(offerStartDate));
    if (offerDays > 30) {
        return false;
    }

    // User saw the initial spotlight but not the second
    if (automaticOfferReminders < AUTOMATIC_OFFER_STATE.secondSpotlight && offerDays >= EXTENDED_REMINDER_DAY) {
        return true;
    }

    // User saw the second spotlight but not the last reminder
    if (automaticOfferReminders < AUTOMATIC_OFFER_STATE.lastReminder && offerDays >= LAST_REMINDER_DAY) {
        return true;
    }

    return false;
};

/**
 * Update the one-dollar post-signup offer state with the next logical state
 * @param offerState value of the offer feature flag
 * @returns new state
 */
export const updatePostSignupOpenOfferState = (
    offerState?: PostSubscriptionOneDollarOfferState
): PostSubscriptionOneDollarOfferState => {
    if (!offerState) {
        return {
            offerStartDate: 0,
            automaticOfferReminders: AUTOMATIC_OFFER_STATE.notStarted,
        };
    }

    const { offerStartDate } = offerState;
    const offerDays = differenceInDays(Date.now(), fromUnixTime(offerStartDate));

    // The user has seen the first spotlight
    if (!offerStartDate) {
        return {
            offerStartDate: Math.floor(Date.now() / 1000),
            automaticOfferReminders: AUTOMATIC_OFFER_STATE.firstSpotlight,
        };
    }

    if (offerDays >= EXTENDED_REMINDER_DAY && offerDays < LAST_REMINDER_DAY) {
        return {
            offerStartDate,
            automaticOfferReminders: AUTOMATIC_OFFER_STATE.secondSpotlight,
        };
    }

    if (offerDays >= LAST_REMINDER_DAY) {
        return {
            offerStartDate,
            automaticOfferReminders: AUTOMATIC_OFFER_STATE.lastReminder,
        };
    }

    return offerState;
};

export const isStateTheSame = (
    after: PostSubscriptionOneDollarOfferState,
    before?: PostSubscriptionOneDollarOfferState
) => {
    return (
        before?.offerStartDate === after.offerStartDate &&
        before?.automaticOfferReminders === after.automaticOfferReminders
    );
};

export const getOfferAgeTelemetryCategory = (day: number) => {
    if (day < 0 || (day >= 0 && day <= 4)) {
        return '0-4';
    }
    if (day >= 5 && day <= 9) {
        return '5-9';
    }
    if (day >= 10 && day <= 14) {
        return '10-14';
    }
    if (day >= 15 && day <= 19) {
        return '15-19';
    }
    if (day >= 20 && day <= 24) {
        return '20-24';
    }
    return '25-30';
};
