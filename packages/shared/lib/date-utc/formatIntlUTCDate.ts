import noop from '@proton/utils/noop';

import { fromUTCDate, toLocalDate } from '../date/timezone';
import { localeCode } from '../i18n';
import { getIntlLocale } from '../i18n/helper';

/**
 * Format UTC date with Intl.DateTimeFormat
 */
export const formatIntlUTCDate = (date: Date, options: Intl.DateTimeFormatOptions) => {
    // fallback locale
    let formatter = new Intl.DateTimeFormat('en-US', options);
    try {
        const intlLocale = getIntlLocale(localeCode);
        formatter = new Intl.DateTimeFormat(intlLocale, options);
    } catch {
        // Intl will throw if the locale is not recognized
        noop();
    }

    // Use fake local date built from the UTC date data
    const localDate = toLocalDate(fromUTCDate(date));

    return formatter.format(localDate);
};
