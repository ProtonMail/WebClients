import { DEFAULT_LOCALE } from '../constants';

/**
 * Gets the first specified locale from the browser, if any.
 */
export const getBrowserLocale = () => {
    return window.navigator.languages && window.navigator.languages.length ? window.navigator.languages[0] : undefined;
};

export const getNormalizedLocale = (locale = '') => {
    return locale.toLowerCase().replace('-', '_');
};

/**
 * Get the closest matching locale from an object of locales.
 */
export const getClosestLocaleMatch = (locale = '', locales = {}) => {
    const localeKeys = [DEFAULT_LOCALE, ...Object.keys(locales)].sort();
    const normalizedLocale = getNormalizedLocale(locale);

    // First by language and country code.
    const fullMatch = localeKeys.find((key) => getNormalizedLocale(key) === normalizedLocale);
    if (fullMatch) {
        return fullMatch;
    }

    // Language code.
    const language = normalizedLocale.substr(0, 2);
    const languageMatch = localeKeys.find((key) => key.substr(0, 2).toLowerCase() === language);
    if (languageMatch) {
        return languageMatch;
    }
};

export const getClosestLocaleCode = (locale: string | undefined, locales: { [key: string]: any }) => {
    if (!locale) {
        return DEFAULT_LOCALE;
    }
    return getClosestLocaleMatch(locale, locales) || DEFAULT_LOCALE;
};
