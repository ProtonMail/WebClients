import { addDays, differenceInDays, differenceInHours, fromUnixTime } from 'date-fns';
import startOfDay from 'date-fns/startOfDay';

import type { Subscription } from '@proton/shared/lib/interfaces';

import { HIDE_OFFER, OfferDuration, ReminderDates, ReminderMaxHours } from '../helpers/interface';

export const isLastDayOfWindow = (subscriptionAge: number) => {
    return Object.values(ReminderDates).some((value) => value + OfferDuration - 1 === subscriptionAge);
};

export const shouldOpenReminder = (subScriptionStart: number, lastReminder: number) => {
    const today = Date.now();
    const subscriptionAge = differenceInDays(today, fromUnixTime(subScriptionStart));
    const isLastDay = isLastDayOfWindow(subscriptionAge);

    if (!isLastDay || lastReminder === HIDE_OFFER) {
        return false;
    }

    return differenceInHours(today, fromUnixTime(lastReminder)) >= ReminderMaxHours;
};

export const isInWindow = (subscriptionAge: number) => {
    return Object.values(ReminderDates).some(
        (value) => subscriptionAge >= value && subscriptionAge <= value + OfferDuration
    );
};

/**
 * Rounds a number up based on its magnitude.
 *
 * For numbers less than or equal to 999, it rounds to the nearest 10.
 * For larger numbers, it rounds only the last three digits to the nearest 100,
 * leaving the thousands and higher digits untouched.
 *
 * @param {number} number The number to round up.
 * @returns {number} The rounded number.
 */
export const roundToUpper = (number: number): number => {
    const SMALL_NUMBER_THRESHOLD = 999;
    const LARGE_NUMBER_ROUNDING_FACTOR = 100;

    if (number <= SMALL_NUMBER_THRESHOLD) {
        return Math.ceil(number / 10) * 10;
    }

    const nonRoundedPart = Math.floor(number / 1000) * 1000;
    const roundedPart = Math.ceil((number % 1000) / LARGE_NUMBER_ROUNDING_FACTOR) * LARGE_NUMBER_ROUNDING_FACTOR;
    return nonRoundedPart + roundedPart;
};

export const getWindowEndDate = (subscriptionAge: number) => {
    const currentWindow = Object.values(ReminderDates).find((value) => {
        return subscriptionAge >= value && subscriptionAge <= value + OfferDuration;
    });

    if (!currentWindow) {
        return null;
    }

    const daysRemainingInWindow = currentWindow + OfferDuration - subscriptionAge;
    return startOfDay(addDays(Date.now(), daysRemainingInWindow));
};

export const getSubscriptionAge = (subscription?: Subscription) => {
    return differenceInDays(Date.now(), fromUnixTime(subscription?.PeriodStart ?? 0));
};
