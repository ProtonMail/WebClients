import { useState } from 'react';

import { differenceInDays, differenceInHours, endOfDay, fromUnixTime, isAfter } from 'date-fns';
import { c, msgid } from 'ttag';

import useInterval from '@proton/hooks/useInterval';
import { MINUTE } from '@proton/shared/lib/constants';

import { formatFullDate } from '../../../helpers/date';
import { isElementConversation } from '../../../helpers/elements';
import type { Element } from '../../../models/element';

const EVERY_MINUTE = MINUTE;

const getShortMessage = (date: Date, now: Date, expiresInLessThan24Hours: boolean) => {
    const hasEnded = isAfter(now, date);

    if (hasEnded) {
        return '';
    }

    const remainingDays = differenceInDays(endOfDay(date), now); // Using endOfDay since differenceInDays count full days
    if (expiresInLessThan24Hours) {
        //translator: This indicates that the message will expires in less than 1 day. Value is hardcoded to make sure we always show that
        return c('Remaining days before the message expire').t`<1 d`;
    }

    //translator: We want to indicate the number of days that are remaining before expiration but only show '10 d' and not '10 days'. Plural is here to accommodate languages that might have different words or conventions for single or multiple days
    return c('Remaining days before the message expire').ngettext(
        msgid`${remainingDays} d`,
        `${remainingDays} d`,
        remainingDays
    );
};

const useItemExpiration = (element: Element, expirationTime?: number) => {
    const [now, setNow] = useState(new Date());
    const expirationDate = fromUnixTime(expirationTime || 0);
    const formattedDate = formatFullDate(expirationDate);
    const expiresInLessThan24Hours = differenceInHours(expirationDate, now) < 24;

    const isConversationWithSeveralMessages = isElementConversation(element) && (element?.NumMessages || 0) > 1;

    useInterval(() => setNow(new Date()), EVERY_MINUTE);

    return {
        tooltipMessage: isConversationWithSeveralMessages
            ? c('Info').t`This conversation contains one or more expiring messages`
            : c('Info').t`This message will expire ${formattedDate}`,
        shortMessage: getShortMessage(expirationDate, now, expiresInLessThan24Hours),
        expiresInLessThan24Hours,
    };
};

export default useItemExpiration;
