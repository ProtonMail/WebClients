import { differenceInDays, fromUnixTime } from 'date-fns';

import {
    ZERO_NINETY_NINE_DURATION,
    ZERO_NINETY_NINE_EXTENDED_REMINDER_DAY,
    ZERO_NINETY_NINE_LAST_REMINDER_DAY,
    ZERO_NINETY_NINE_OFFER_STATE,
    type ZeroNinetyNineOfferState,
} from './interface';

/**
 * Whether the spotlight should auto-open, based on how far through the offer the user is
 * and which reminders they have already been shown.
 */
export const shouldOpenZeroNinetyNineOffer = (offerState?: ZeroNinetyNineOfferState) => {
    if (!offerState) {
        return false;
    }

    const { offerStartDate, automaticOfferReminders } = offerState;
    if (!offerStartDate && automaticOfferReminders === ZERO_NINETY_NINE_OFFER_STATE.notStarted) {
        return true;
    }

    const offerDays = differenceInDays(Date.now(), fromUnixTime(offerStartDate));
    if (offerDays > ZERO_NINETY_NINE_DURATION) {
        return false;
    }

    // User saw the initial spotlight but not the second
    if (
        automaticOfferReminders < ZERO_NINETY_NINE_OFFER_STATE.secondSpotlight &&
        offerDays >= ZERO_NINETY_NINE_EXTENDED_REMINDER_DAY
    ) {
        return true;
    }

    // User saw the second spotlight but not the last reminder
    if (
        automaticOfferReminders < ZERO_NINETY_NINE_OFFER_STATE.lastReminder &&
        offerDays >= ZERO_NINETY_NINE_LAST_REMINDER_DAY
    ) {
        return true;
    }

    return false;
};

/**
 * Advances the offer state to the next logical stage. The first advance stamps the offer
 * start date, which is what the 30 day expiry and the reminder days are measured from.
 */
export const updateZeroNinetyNineOfferState = (offerState?: ZeroNinetyNineOfferState): ZeroNinetyNineOfferState => {
    if (!offerState) {
        return {
            offerStartDate: 0,
            automaticOfferReminders: ZERO_NINETY_NINE_OFFER_STATE.notStarted,
        };
    }

    const { offerStartDate } = offerState;
    const offerDays = differenceInDays(Date.now(), fromUnixTime(offerStartDate));

    // The user has seen the first spotlight
    if (!offerStartDate) {
        return {
            offerStartDate: Math.floor(Date.now() / 1000),
            automaticOfferReminders: ZERO_NINETY_NINE_OFFER_STATE.firstSpotlight,
        };
    }

    if (offerDays >= ZERO_NINETY_NINE_EXTENDED_REMINDER_DAY && offerDays < ZERO_NINETY_NINE_LAST_REMINDER_DAY) {
        return {
            offerStartDate,
            automaticOfferReminders: ZERO_NINETY_NINE_OFFER_STATE.secondSpotlight,
        };
    }

    if (offerDays >= ZERO_NINETY_NINE_LAST_REMINDER_DAY) {
        return {
            offerStartDate,
            automaticOfferReminders: ZERO_NINETY_NINE_OFFER_STATE.lastReminder,
        };
    }

    return offerState;
};

export const isZeroNinetyNineStateTheSame = (after: ZeroNinetyNineOfferState, before?: ZeroNinetyNineOfferState) => {
    return (
        before?.offerStartDate === after.offerStartDate &&
        before?.automaticOfferReminders === after.automaticOfferReminders
    );
};

export const getZeroNinetyNineOfferAgeCategory = (day: number) => {
    if (day < 0 || day <= 4) {
        return '0-4';
    }
    if (day <= 9) {
        return '5-9';
    }
    if (day <= 14) {
        return '10-14';
    }
    if (day <= 19) {
        return '15-19';
    }
    if (day <= 24) {
        return '20-24';
    }
    return '25-30';
};
