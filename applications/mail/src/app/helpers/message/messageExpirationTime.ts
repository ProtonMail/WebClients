import { format, fromUnixTime, isToday, isTomorrow } from 'date-fns';
import { c } from 'ttag';

import { MessageState } from '../../logic/messages/messagesTypes';
import { formatFullDate } from '../date';

export const getMessageExpirationDate = (message: MessageState) => {
    if (message.data?.ExpirationTime) {
        return fromUnixTime(message.data.ExpirationTime);
    } else if (message.draftFlags?.expiresIn) {
        return message.draftFlags.expiresIn;
    }

    return undefined;
};

export const getExpiresOnMessage = (expirationDate: Date) => {
    const shortDateMessage = format(expirationDate, 'p');

    if (isToday(expirationDate)) {
        //translator: Full sentence for reference: "This message will expire today at 12:30 PM"
        return c('Info').t`This message will expire today at ${shortDateMessage}`;
    } else if (isTomorrow(expirationDate)) {
        // translator: Full sentence for reference: "This message will expire tomorrow at 12:30 PM"
        return c('Info').t`This message will expire tomorrow at ${shortDateMessage}`;
    } else {
        const longDateMEssage = formatFullDate(expirationDate);
        // translator: Full sentence for reference: "This message will expire on Tuesday, May 11 at 12:30 PM"
        return c('Info').t`This message will expire on ${longDateMEssage}`;
    }
};

export const getAutoDeleteOnMessage = (expirationDate: Date) => {
    const shortDateMessage = format(expirationDate, 'p');

    if (isToday(expirationDate)) {
        //translator: Full sentence for reference: "This message will be automatically deleted on 12:30 PM"
        return c('Info').t`This message will be automatically deleted on ${shortDateMessage}`;
    } else if (isTomorrow(expirationDate)) {
        // translator: Full sentence for reference: "This message will be automatically deleted on 12:30 PM"
        return c('Info').t`This message will be automatically deleted on ${shortDateMessage}`;
    } else {
        const longDateMEssage = formatFullDate(expirationDate);
        // translator: Full sentence for reference: "This message will be automatically deleted on Tuesday, May 11 at 12:30 PM"
        return c('Info').t`This message will be automatically deleted on ${longDateMEssage}`;
    }
};
