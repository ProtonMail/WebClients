import { format as formatDate, fromUnixTime, getUnixTime, isSameDay } from 'date-fns';

import { serverTime } from '@proton/crypto';

export type Options = Parameters<typeof formatDate>[2] & {
    /**
     * Date format if `unixTime` argument is today. If false then force `format`. 'p' by default.
     */
    sameDayFormat?: string | false;
    /**
     * Date format in general case. 'PP' by default.
     */
    format?: string;
};

/**
 * Convert UNIX timestamp into a readable time. The format of the readable time is:
 * ** Hours and minutes if the UNIX timestamp is from the same day,
 * ** Day, month and year otherwise
 */
export const readableTime = (unixTime: number, options?: Options) => {
    const sameDayFormat = options?.sameDayFormat ?? 'p';
    const format = options?.format ?? 'PP';

    const date = fromUnixTime(unixTime);

    if (sameDayFormat && isSameDay(date, Date.now())) {
        return formatDate(date, sameDayFormat, options);
    }

    return formatDate(date, format, options);
};

export const getCurrentUnixTimestamp = () => {
    return getUnixTime(serverTime());
};
