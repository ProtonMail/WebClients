import { formatIntlDate } from '../date/formatIntlDate';
import { fromUTCDate, toLocalDate } from '../date/timezone';
import { localeCode } from '../i18n';

/**
 * Format UTC date with Intl.DateTimeFormat
 * @param date      date to be formatted
 * @param options   formatting options, e.g. { weekday: 'short', month: 'long', year: 'numeric', timeStyle: 'short' }
 * @param locale    [Optional] locale to be used when formatting. Defaults to the app locale
 */
export const formatIntlUTCDate = (date: Date, options: Intl.DateTimeFormatOptions, locale = localeCode) => {
    // Use fake local date built from the UTC date data
    const localDate = toLocalDate(fromUTCDate(date));

    return formatIntlDate(localDate, options, locale);
};
