import { addMinutes, differenceInMinutes, fromUnixTime, getUnixTime, isToday } from 'date-fns';

import { serverTime } from '@proton/crypto';
import type { MessageState, MessageWithOptionalBody } from '@proton/mail/store/messages/messagesTypes';
import type { UserModel } from '@proton/shared/lib/interfaces';
import { isFrozenExpiration } from '@proton/shared/lib/mail/messages';

import { isAllowedAutoDeleteLabelID } from './autoDelete';

export const canSetExpiration = (featureFlagValue: boolean, user: UserModel, messageState?: MessageState) => {
    const hasFrozenExpiration = isFrozenExpiration(messageState?.data);
    const { LabelIDs = [] } = messageState?.data || {};

    if (hasFrozenExpiration) {
        return false;
    }

    if (!featureFlagValue) {
        return false;
    }

    if (!user.hasPaidMail) {
        return false;
    }

    if (!LabelIDs.length || LabelIDs.some((labelID) => isAllowedAutoDeleteLabelID(labelID))) {
        return false;
    }

    return true;
};

export const getExpirationTime = (date?: Date) => {
    return date ? getUnixTime(date) : null;
};

export const isExpired = <T extends { ExpirationTime?: number }>(element: T, timestamp?: number) => {
    const { ExpirationTime } = element;
    return Boolean(ExpirationTime && ExpirationTime < getUnixTime(timestamp ?? +serverTime()));
};

// Return the correct min interval to display in the time input for expiration (self-destruct)
export const getMinExpirationTime = (date: Date) => {
    // If date is not today, there is no min time because we want to display all intervals
    if (!isToday(date)) {
        return undefined;
    }

    // Date that will be used for intervals, we don't want it to have minutes or seconds set in intervals
    // Intervals needs to be XX:00 AM/PM or XX:30 AM/PM
    const nowForInterval = new Date();
    nowForInterval.setMinutes(0, 0);

    // Current date used to get the correct min interval to display to the user
    const now = new Date();

    // Calculate intervals
    // If it's 9:50 AM/PM, we should get
    // 9:30, 10:00, 10:30
    const nextIntervals = Array.from(Array(3)).map((_, i) => addMinutes(nowForInterval, 30 * (i + 1)));

    return nextIntervals.find((interval) => interval > now && differenceInMinutes(interval, now) >= 15);
};

/**
 * Defines the expiration based on the difference between the expiration time and the receive time.
 */
export const getExpiresIn = (message?: Partial<MessageWithOptionalBody>): Date | undefined => {
    if (!message?.ExpirationTime || !message?.Time) {
        return undefined;
    }

    // Exclude expiration set by the user (includes filter)
    // A frozen expiration is set by the sender, not the user/filter
    if (message?.Flags && !isFrozenExpiration(message)) {
        return undefined;
    }

    const currentDate = new Date();
    const expirationDate = fromUnixTime(message.ExpirationTime);
    const receiveDate = fromUnixTime(message.Time);
    const deltaInMinutes = differenceInMinutes(expirationDate, receiveDate);

    return addMinutes(currentDate, deltaInMinutes);
};
