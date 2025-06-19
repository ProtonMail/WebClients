import { format, fromUnixTime, isToday, isTomorrow } from 'date-fns';
import { c } from 'ttag';

import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { dateLocale } from '@proton/shared/lib/i18n';

import { formatFullDate } from '../date';

export const getMessageExpirationDate = (message: MessageState) => {
    if (message.data?.ExpirationTime) {
        return fromUnixTime(message.data.ExpirationTime);
    } else if (message.draftFlags?.expiresIn) {
        return message.draftFlags.expiresIn;
    }

    return undefined;
};

const getTodayText = (value: string) => {
    //translator: Full sentence for reference: "This message will expire today at 12:30 PM"
    return c('Info').t`This message will expire today at ${value}`;
};

const getTomorrowText = (value: string) => {
    // translator: Full sentence for reference: "This message will expire tomorrow at 12:30 PM"
    return c('Info').t`This message will expire tomorrow at ${value}`;
};

const getOnText = (value: string) => {
    // translator: Full sentence for reference: "This message will expire on Tuesday, May 11 at 12:30 PM"
    return c('Info').t`This message will expire on ${value}`;
};

export const getExpiresOnMessage = (expirationDate: Date) => {
    const shortDateMessage = format(expirationDate, 'p', { locale: dateLocale });

    if (isToday(expirationDate)) {
        return getTodayText(shortDateMessage);
    } else if (isTomorrow(expirationDate)) {
        return getTomorrowText(shortDateMessage);
    } else {
        return getOnText(formatFullDate(expirationDate));
    }
};

const getDeletedOnText = (value: string) => {
    //translator: Full sentence for reference: "This message will be automatically deleted on Saturday, May 4th 2024 1:37 PM"
    return c('Info').t`This message will be automatically deleted on ${value}`;
};

const getDeletedAtText = (value: string) => {
    //translator: Full sentence for reference: "This message will be automatically deleted at 1:37 PM"
    return c('Info').t`This message will be automatically deleted at ${value}`;
};

export const getAutoDeleteOnMessage = (expirationDate: Date) => {
    const shortDateMessage = format(expirationDate, 'p', { locale: dateLocale });

    if (isToday(expirationDate)) {
        return getDeletedAtText(shortDateMessage);
    } else if (isTomorrow(expirationDate)) {
        return getDeletedAtText(shortDateMessage);
    } else {
        return getDeletedOnText(formatFullDate(expirationDate));
    }
};
