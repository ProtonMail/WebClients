import { add, fromUnixTime, isToday, set } from 'date-fns';

import { FUTURE_MESSAGES_BUFFER } from '../../../../constants';

/**
 * If now is between midnight and 8am (minus buffer)
 */
export const isScheduledDuringNight = () => {
    const now = new Date();
    const BUFFER_IN_MINUTES = FUTURE_MESSAGES_BUFFER / 60;
    const dayStart = set(now, {
        hours: 0,
        minutes: 0,
        seconds: 0,
    });
    const dayStartOfMorning = add(dayStart, {
        hours: 7,
        minutes: 60 - BUFFER_IN_MINUTES,
        seconds: 59,
    });
    return now > dayStart && now < dayStartOfMorning;
};

/**
 * Time is between midnight and 12:00am
 * @param date
 * @returns boolean
 */
const isMorning = (date: Date) => {
    const dayStart = set(date, {
        hours: 0,
        minutes: 0,
        seconds: 0,
    });
    const endOfMorning = add(dayStart, {
        hours: 12,
        minutes: 0,
        seconds: 0,
    });
    return date > dayStart && date < endOfMorning;
};

/**
 * Allows to know if we should display "in the morning" instead of "today"
 * @param scheduledTimestamp - optionnal - If scheduledDate is there it should be the morning for today and the moment we sent the
 * @returns boolean
 */
export const isScheduledSendTodayMorning = (scheduledTimestamp: number | Date) => {
    const scheduledDate =
        typeof scheduledTimestamp === 'number' ? fromUnixTime(scheduledTimestamp) : scheduledTimestamp;

    return isToday(scheduledDate) && isMorning(scheduledDate);
};
