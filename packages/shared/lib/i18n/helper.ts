import { DEFAULT_LOCALE } from '../constants';

/**
 * Gets the first specified locale from the browser, if any.
 */
export const getBrowserLocale = () => {
    return window.navigator?.languages?.[0];
};

export const getNormalizedLocale = (locale = '') => {
    return locale.toLowerCase().replace('-', '_');
};

/**
 * Takes the first portion, e.g. nl_NL => nl, kab_KAB => kab
 */
export const getLanguageCode = (locale = '') => {
    return getNormalizedLocale(locale).split('_')[0];
};

/**
 * Get the closest matching locale from an object of locales.
 */
export const getClosestLocaleMatch = (locale = '', locales = {}) => {
    const localeKeys = [DEFAULT_LOCALE, ...Object.keys(locales)].sort();
    const normalizedLocaleKeys = localeKeys.map(getNormalizedLocale);
    const normalizedLocale = getNormalizedLocale(locale);

    // First by language and country code.
    const fullMatchIndex = normalizedLocaleKeys.findIndex((key) => key === normalizedLocale);
    if (fullMatchIndex >= 0) {
        return localeKeys[fullMatchIndex];
    }

    // Language code.
    const language = getLanguageCode(normalizedLocale);
    const languageMatchIndex = normalizedLocaleKeys.findIndex((key) => {
        return getLanguageCode(key) === language;
    });
    if (languageMatchIndex >= 0) {
        return localeKeys[languageMatchIndex];
    }
};

export const getClosestLocaleCode = (locale: string | undefined, locales: { [key: string]: any }) => {
    if (!locale) {
        return DEFAULT_LOCALE;
    }
    return getClosestLocaleMatch(locale, locales) || DEFAULT_LOCALE;
};
