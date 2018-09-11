const CUSTOM_LOCALE = 'custom-locale';

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

/**
 * Select the moment locale to use, given an app locale and navigator locale.
 * NOTE: This implementation creates a custom locale.
 * @param {String} appLocale
 * @param {String} navigatorLocale
 * @returns {string}
 */
export const selectLocale = (appLocale, navigatorLocale = formatLocale()) => {
    /**
     * Note: moment.localeData will try to be smart and find the locale given the string. It can be
     * 'fr', or 'fr-FR' and it will automatically handle that.
     * If it can't find any match it will return the default format (American English).
     */
    const navigatorLocaleData = moment.localeData(navigatorLocale);
    const appLocaleData = moment.localeData(appLocale);

    // Remove old configuration first, if any.
    moment.updateLocale(CUSTOM_LOCALE, null);
    /**
     * By default we use the same date-time locale as you have selected in the app in order
     * to get the correct translations for days, months, year, etc. However, we override
     * the longDateFormat to get 12 or 24 hour time or the correct date format depending
     * on what you have selected in your browser.
     */
    moment.updateLocale(CUSTOM_LOCALE, {
        // eslint-disable-next-line no-underscore-dangle
        ...appLocaleData._config,
        // eslint-disable-next-line no-underscore-dangle
        longDateFormat: navigatorLocaleData._config.longDateFormat
    });

    return CUSTOM_LOCALE;
};
