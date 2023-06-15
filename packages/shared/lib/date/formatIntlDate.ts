import { localeCode } from '../i18n';
import { getIntlLocale } from '../i18n/helper';

/**
 * Format date with Intl.DateTimeFormat
 * @param date      date to be formatted
 * @param options   formatting options, e.g. { weekday: 'short', month: 'long', year: 'numeric', timeStyle: 'short' }
 * @param locale    [Optional] locale to be used when formatting. Defaults to the app locale
 */
export const formatIntlDate = (date: Date, options: Intl.DateTimeFormatOptions, locale = localeCode) => {
    const intlLocale = getIntlLocale(locale);
    // In case the locale is not recognized by Intl, we fallback to en-US
    const formatter = new Intl.DateTimeFormat([intlLocale, 'en-US'], options);

    return formatter.format(date);
};
