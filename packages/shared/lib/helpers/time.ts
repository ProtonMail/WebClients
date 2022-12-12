import { format as formatDate, fromUnixTime, getUnixTime, isSameDay } from 'date-fns';

import { serverTime } from '@proton/crypto';

export type Options = Parameters<typeof formatDate>[2] & {
    sameDayFormat?: string;
    differentDayFormat?: string;
};

/**
 * Convert UNIX timestamp into a readable time. The format of the readable time is:
 * ** Hours and minutes if the UNIX timestamp is from the same day,
 * ** Day, month and year otherwise
 */
export const readableTime = (unixTime: number, options?: Options) => {
    const sameDayFormat = options?.sameDayFormat ?? 'p';
    const differentDayFormat = options?.differentDayFormat ?? 'PP';

    const date = fromUnixTime(unixTime);

    if (isSameDay(date, Date.now())) {
        return formatDate(date, sameDayFormat, options);
    }

    return formatDate(date, differentDayFormat, options);
};

/**
 * Convert UNIX timestamp into a readable time. The format of the readable time is:
 * ** Hours and minutes if the UNIX timestamp is from the same day,
 * ** Day, month and year otherwise
 */
export const readableTimeLegacy = (unixTime: number, format = 'PP', options?: Options, forceFormat = false) => {
    const localOptions = {
        ...options,
        differentDayFormat: format,
    };

    if (forceFormat) {
        localOptions.sameDayFormat = localOptions.differentDayFormat;
    }

    return readableTime(unixTime, localOptions);
};

export const getCurrentUnixTimestamp = () => {
    return getUnixTime(serverTime());
};
