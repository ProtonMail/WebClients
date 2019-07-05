import { addLocale, useLocale, setDefaultLang } from 'ttag';
import { DEFAULT_TRANSLATION } from '../constants';
import { set as setMomentLocale } from './moment';

/**
 * Return the entered locale or the first locale that the browser provides.
 * @param  {String} locale
 * @return {String}
 */
export const formatLocale = (locale) => {
    const firstLanguage =
        window.navigator.languages && window.navigator.languages.length ? window.navigator.languages[0] : null;
    return locale || firstLanguage || window.navigator.userLanguage || window.navigator.language;
};

const upperCaseLocale = (locale = '') => (locale === 'en' ? 'us' : locale).toUpperCase();

/**
 * We expect it as fr_FR not fr-FR
 * @param {String} locale
 * @returns {string}
 */
const getTransformedLocale = (locale = '') => {
    const changedLocale = locale.replace('-', '_');
    // OS is in French (France) => navigator.language === fr
    if (changedLocale.length === 2) {
        return `${changedLocale}_${upperCaseLocale(changedLocale)}`;
    }
    return changedLocale;
};

const getBrowserLocale = () => {
    // Doesn't work on IE11 ;)
    try {
        const queryParams = new window.URL(window.location).searchParams;
        return getTransformedLocale(formatLocale(queryParams.get('language')));
    } catch (e) {
        // Match: xx_XX xx-XX xx 1192
        const [, locale] = window.location.search.match(/language=(([a-z]{2,}(_|-)[A-Z]{2,})|([a-z]{2,}))/) || [];
        return getTransformedLocale(formatLocale(locale));
    }
};

/**
 * Return a matched locale if it exists in our supported translations.
 * Otherwise returns the default translation.
 * @param {String} browserLocale e.g. en_GB
 * @returns {String}
 */
const getTranslation = (browserLocale = '', translations = []) => {
    // Check if the full locale exists in the translations.
    if (translations.includes(browserLocale)) {
        return browserLocale;
    }

    // Try again, but only match on the language, not on the locale.
    const browserLanguage = browserLocale.substr(0, 2);
    const translationByLanguage = translations.find((lang) => lang.substr(0, 2) === browserLanguage);
    if (translationByLanguage) {
        return translationByLanguage;
    }

    return DEFAULT_TRANSLATION;
};

export const getLocale = (lang, translations) => {
    const browser = getBrowserLocale();
    const locale = getTranslation(lang || browser, translations);
    const language = locale.substr(0, 2);
    return { browser, locale, language };
};

export function localeFactory({ TRANSLATIONS = [], TRANSLATIONS_URL } = {}) {
    const toUrl = (scope) => {
        const baseUrl = [TRANSLATIONS_URL, 'i18n'].filter(Boolean);
        return ['', ...baseUrl].concat(`${scope}.json`).join('/');
    };

    return async (lang) => {
        const { locale, browser, language } = getLocale(lang, TRANSLATIONS);

        document.documentElement.lang = language;

        // If it's the default translation, we don't need to load the json since it's loaded by default.
        if (locale === DEFAULT_TRANSLATION) {
            setDefaultLang(locale);
            useLocale(locale);
            return { locale, browser, language };
        }

        try {
            const rep = await fetch(toUrl(locale));
            const data = await rep.json();

            addLocale(locale, data);
            setDefaultLang(locale);
            useLocale(locale);
            setMomentLocale(locale);
            return { locale, browser, language };
        } catch (e) {
            // ninja
            console.error(e);
            return { locale: lang };
        }
    };
}
