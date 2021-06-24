import { DEFAULT_LOCALE } from '../constants';

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
 * Gets the first specified locale from the browser, if any.
 *
 * If the first locale does not have a region and the second is a regional variant of the first, take it instead.
 */
export const getBrowserLocale = () => {
    const first = window.navigator?.languages?.[0];
    const second = window.navigator?.languages?.[1];

    if (!/[_-]/.test(first) && /[_-]/.test(second) && getLanguageCode(first) === getLanguageCode(second)) {
        return second;
    }

    return first;
};

/**
 * Give a higher score to locales with higher chances to be a proper fallback languages
 * when there is no exact match.
 */
const getLanguagePriority = (locale: string) => {
    const parts = locale.toLowerCase().split(/[_-]/);

    // Prefer language (en) over language + region (en_US)
    if (parts.length === 1) {
        return 2;
    }

    // Prefer region matching language (fr_FR, it_IT, de_DE) over other regions (fr_CA, it_CH, de_AU)
    return parts[0] === parts[1] ? 1 : 0;
};

/**
 * Get the closest matching locale from an object of locales.
 */
export const getClosestLocaleMatch = (locale = '', locales = {}) => {
    const localeKeys = [DEFAULT_LOCALE, ...Object.keys(locales)].sort((first, second) => {
        if (first === second) {
            return 0;
        }

        const firstPriority = getLanguagePriority(first);
        const secondPriority = getLanguagePriority(second);

        if (firstPriority > secondPriority) {
            return -1;
        }

        if (firstPriority < secondPriority) {
            return 1;
        }

        return first > second ? 1 : -1;
    });
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
