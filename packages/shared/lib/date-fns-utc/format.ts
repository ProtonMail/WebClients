import { UTCDate } from '@date-fns/utc';
import type { FirstWeekContainsDate, Locale } from 'date-fns';
import { format, isValid } from 'date-fns';

import type { WeekStartsOn } from './interface';

export interface Options {
    locale?: Locale;
    weekStartsOn?: WeekStartsOn;
    firstWeekContainsDate?: FirstWeekContainsDate;
}

/**
 * Same as the format function from date-fns, but formats the date as it is in UTC.
 * Unlike date-fns format, it returns an empty string for invalid dates and allows the week-year and
 * day-of-year tokens (YYYY, DD).
 */
const formatUTC = (utcDate: Date, formatString: string, options: Options = {}) => {
    // date-fns format throws on a format string with nothing but line breaks, which `.` does not match
    if (!isValid(utcDate) || !/./.test(formatString)) {
        return '';
    }

    return format(new UTCDate(utcDate), formatString, {
        ...options,
        useAdditionalWeekYearTokens: true,
        useAdditionalDayOfYearTokens: true,
    });
};

export default formatUTC;
