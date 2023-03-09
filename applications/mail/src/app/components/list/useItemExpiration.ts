import { useState } from 'react';

import {
    differenceInDays,
    differenceInHours,
    differenceInYears,
    endOfDay,
    fromUnixTime,
    isAfter,
    isToday,
} from 'date-fns';
import { c, msgid } from 'ttag';

import useInterval from '@proton/hooks/useInterval';

import { formatFullDate } from '../../helpers/date';

const EVERY_THIRTY_MINUTES = 30 * 60 * 1000;

const getShortMessage = (date: Date, now: Date) => {
    const hasEnded = isAfter(now, date);

    if (hasEnded) {
        return '';
    }

    const remainingYears = differenceInYears(date, now);

    if (remainingYears) {
        return c('Remaining years before the message expire').ngettext(
            msgid`${remainingYears} year`,
            `${remainingYears} years`,
            remainingYears
        );
    }

    const remainingDays = differenceInDays(endOfDay(date), now); // Using endOfDay since differenceInDays count full days

    if (remainingDays) {
        return c('Remaining days before the message expire').ngettext(
            msgid`${remainingDays} day`,
            `${remainingDays} days`,
            remainingDays
        );
    }

    const remainingHours = differenceInHours(date, now);

    if (remainingHours) {
        return c('Remaining hours before the message expire').ngettext(
            msgid`${remainingHours} hour`,
            `${remainingHours} hours`,
            remainingHours
        );
    }

    return c('Remaining time before the message expire').t`<1 hour`;
};

const useItemExpiration = (expirationTime?: number) => {
    const [now, setNow] = useState(new Date());
    const expirationDate = fromUnixTime(expirationTime || 0);
    const formattedDate = formatFullDate(expirationDate);

    useInterval(() => setNow(new Date()), EVERY_THIRTY_MINUTES);

    return {
        tooltipMessage: c('Info').t`This message will expire ${formattedDate}`,
        shortMessage: getShortMessage(expirationDate, now),
        willExpireToday: isToday(expirationDate),
    };
};

export default useItemExpiration;
