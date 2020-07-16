import { DEFAULT_LOCALE } from '../constants';
import dateFnLocales from './dateFnLocales';

/**
 * Gets the first specified locale from the browser, if any.
 * @return {String}
 */
export const getBrowserLocale = () => {
    return window.navigator.languages && window.navigator.languages.length ? window.navigator.languages[0] : undefined;
};

/**
 * Get the closest matching locale from an object of locales.
 * @param {String} locale
 * @param {Object} locales
 * @return {String}
 */
export const getClosestMatch = (locale = '', locales = {}) => {
    const localeKeys = Object.keys(locales);
    const normalizedLocale = locale.toLowerCase().replace('-', '_');

    // First by language and country code.
    const fullMatch = localeKeys.find((key) => key.toLowerCase() === normalizedLocale);
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

export const getClosestMatches = ({ locale = DEFAULT_LOCALE, browserLocale = DEFAULT_LOCALE, locales = {} }) => {
    const localeCode = getClosestMatch(locale, locales) || DEFAULT_LOCALE;
    const dateLocaleCode = getClosestMatch(localeCode, dateFnLocales) || DEFAULT_LOCALE;
    const longDateLocaleCode = getClosestMatch(browserLocale, dateFnLocales) || localeCode;

    const languageCode = localeCode.substr(0, 2);

    return {
        localeCode,
        languageCode,
        dateLocaleCode,
        longDateLocaleCode,
    };
};
