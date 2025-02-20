import { differenceInDays, differenceInHours, fromUnixTime } from 'date-fns';

import { HIDE_OFFER, OfferDuration, ReminderDates, ReminderMaxHours } from '../components/interface';

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

export const roundToUpper = (number: number): number => {
    const numberOfDigits = number.toString().length;
    const roundingFactor = Math.pow(10, numberOfDigits - 2);
    return Math.ceil(number / roundingFactor) * roundingFactor;
};
