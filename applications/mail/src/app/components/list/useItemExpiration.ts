import { useEffect, useState } from 'react';

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

import { formatFullDate } from '../../helpers/date';

const EVERY_THIRTY_MINUTES = 30 * 60 * 1000;

const useItemExpiration = (expirationTime?: number) => {
    const date = fromUnixTime(expirationTime || 0);
    const end = endOfDay(date);
    const formattedDate = formatFullDate(date);
    const tooltipMessage = c('Info').t`This message will expire ${formattedDate}`;
    const [willExpireToday, setWillExpireToday] = useState(isToday(date));
    const [shortMessage, setShortMessage] = useState('');

    useEffect(() => {
        if (expirationTime) {
            const callback = () => {
                const now = new Date();
                const remainingHours = differenceInHours(date, now);
                const remainingDays = differenceInDays(end, now); // Using endOfDay since differenceInDays count full days
                const remainingYears = differenceInYears(date, now);
                const hasEnded = isAfter(now, date);
                const expiringToday = isToday(date);

                setWillExpireToday(expiringToday);

                if (hasEnded) {
                    setShortMessage('');
                } else if (remainingYears) {
                    setShortMessage(
                        c('Remaining years before the message expire').ngettext(
                            msgid`${remainingYears} year`,
                            `${remainingYears} years`,
                            remainingYears
                        )
                    );
                } else if (remainingDays) {
                    setShortMessage(
                        c('Remaining days before the message expire').ngettext(
                            msgid`${remainingDays} day`,
                            `${remainingDays} days`,
                            remainingDays
                        )
                    );
                } else if (remainingHours) {
                    setShortMessage(
                        c('Remaining hours before the message expire').ngettext(
                            msgid`${remainingHours} hour`,
                            `${remainingHours} hours`,
                            remainingHours
                        )
                    );
                } else {
                    setShortMessage(c('Remaining time before the message expire').t`<1 hour`);
                }
            };

            callback();

            const timeout = setInterval(callback, EVERY_THIRTY_MINUTES);

            return () => clearTimeout(timeout);
        }
        return undefined;
    }, [expirationTime]);

    return {
        tooltipMessage,
        shortMessage,
        willExpireToday,
    };
};

export default useItemExpiration;
