import { format as formatDate, fromUnixTime, getUnixTime, isSameDay } from 'date-fns';
import { serverTime } from 'pmcrypto';

type Options = Parameters<typeof formatDate>[2];
/**
 * Convert UNIX timestamp into a readable time. The format of the readable time is:
 * ** Hours and minutes if the UNIX timestamp is from the same day,
 * ** Day, month and year otherwise
 */
export const readableTime = (unixTime: number, format = 'PP', options: Options) => {
    const date = fromUnixTime(unixTime);

    if (isSameDay(date, Date.now())) {
        return formatDate(date, 'p', options);
    }

    return formatDate(date, format, options);
};

export const getCurrentUnixTimestamp = () => {
    return getUnixTime(serverTime());
};
