import { localeCode } from '../i18n';
import { getIntlLocale } from './helper';

/**
 * Format a percentage with Intl.NumberFormat, so the sign and % symbol follow the locale, e.g. -40% in English, -%40 in Turkish
 * @param percent   percentage to be formatted, e.g. -40 for -40%
 * @param options   [Optional] formatting options, e.g. { signDisplay: 'always' }
 * @param locale    [Optional] locale to be used when formatting. Defaults to the app locale
 */
export const formatIntlPercent = (percent: number, options: Intl.NumberFormatOptions = {}, locale = localeCode) => {
    const intlLocale = getIntlLocale(locale);
    // In case the locale is not recognized by Intl, we fallback to en-US
    const formatter = new Intl.NumberFormat([intlLocale, 'en-US'], { numberingSystem: 'latn', ...options, style: 'percent' });

    return formatter.format(percent / 100);
};
