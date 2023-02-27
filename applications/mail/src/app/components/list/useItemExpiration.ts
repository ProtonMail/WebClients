import { useEffect, useState } from 'react';

import {
    differenceInDays,
    differenceInHours,
    differenceInMonths,
    differenceInWeeks,
    differenceInYears,
    fromUnixTime,
    isToday,
} from 'date-fns';
import { c } from 'ttag';

import { formatFullDate } from '../../helpers/date';

const EVERY_THIRTY_MINUTES = 30 * 60 * 1000;

const useItemExpiration = (expirationTime?: number) => {
    const date = fromUnixTime(expirationTime || 0);
    const formattedDate = formatFullDate(date);
    const tooltipMessage = c('Info').t`This message will expire ${formattedDate}`;
    const [willExpireToday, setWillExpireToday] = useState(isToday(date));
    const [shortMessage, setShortMessage] = useState('');

    useEffect(() => {
        if (expirationTime) {
            const now = new Date();
            const remainingHours = differenceInHours(date, now);
            const remainingDays = differenceInDays(date, now);
            const remainingWeeks = differenceInWeeks(date, now);
            const remainingMonths = differenceInMonths(date, now);
            const remaingYears = differenceInYears(date, now);

            const callback = () => {
                const expiringToday = isToday(date);

                setWillExpireToday(expiringToday);

                if (remaingYears > 1) {
                    setShortMessage(c('Remaining years before the message expire').t`${remaingYears} years`);
                } else if (remainingMonths > 1) {
                    setShortMessage(c('Remaining months before the message expire').t`${remainingMonths} months`);
                } else if (remainingWeeks > 1) {
                    setShortMessage(c('Remaining weeks before the message expire').t`${remainingWeeks} weeks`);
                } else if (remainingDays > 1) {
                    setShortMessage(c('Remaining days before the message expire').t`${remainingDays} days`);
                } else if (remainingHours > 1) {
                    setShortMessage(c('Remaining hours before the message expire').t`${remainingHours} hours`);
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
