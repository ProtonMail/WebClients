import { addLocale, useLocale, setDefaultLang } from 'ttag';

import { DEFAULT_LOCALE } from '../constants';
import { set as setMomentLocale } from './moment';

/**
 * Gets the first specified locale from the browser, if any.
 * @return {String}
 */
export const getBrowserLocale = () => {
    return window.navigator.languages && window.navigator.languages.length ? window.navigator.languages[0] : undefined;
};

/**
 * Get the closest matching locale.
 * @param {String} locale
 * @param {Object} locales
 * @return {String}
 */
export const getBestMatch = (locale, locales) => {
    if (!locale) {
        return DEFAULT_LOCALE;
    }

    const localeKeys = Object.keys(locales);
    // First by language and country code.
    const fullMatch = localeKeys.find((key) => key === locale);
    if (fullMatch) {
        return fullMatch;
    }

    // Language code.
    const language = locale.substr(0, 2);
    const languageMatch = localeKeys.find((key) => key.substr(0, 2) === language);
    if (languageMatch) {
        return languageMatch;
    }

    return DEFAULT_LOCALE;
};

// Since it affects the whole app it's just easier for now.
// eslint-disable-next-line import/no-mutable-exports
let currentLocale;

/**
 * Load a locale.
 * If only a language is specified, try to get the first best match.
 * @param {String} locale - E.g. fr, fr_FR, or en_US
 * @param {Object} locales - An object of locale keys -> dynamic import functions
 * @return {Promise} new locale or nothing
 */
export const loadLocale = async (locale = '', locales = {}) => {
    const bestMatch = getBestMatch(locale, locales);

    // No need to update if it's the same.
    if (currentLocale === bestMatch) {
        return;
    }

    const language = bestMatch.substr(0, 2);

    if (bestMatch !== DEFAULT_LOCALE) {
        const data = (await locales[bestMatch]()).default;
        addLocale(locale, data);
    }

    setDefaultLang(language);
    useLocale(locale);
    setMomentLocale(locale, getBrowserLocale());

    currentLocale = locale;
    document.documentElement.lang = language;
};

export { currentLocale };
