import moment from 'moment';

const CUSTOM_LOCALE = 'custom-locale';

/*
    Set new relative time thresholds
    s seconds least number of seconds to be considered a minute
    m minutes least number of minutes to be considered an hour
    h hours   least number of hours to be considered a day
 */
moment.relativeTimeThreshold('s', 59);
moment.relativeTimeThreshold('m', 59);
moment.relativeTimeThreshold('h', 23);

/**
 * Select the moment locale to use, given an app locale and navigator locale.
 * NOTE: This implementation creates a custom locale.
 * @param {String} appLocale
 * @param {String} navigatorLocale
 * @returns {string}
 */
export const set = (appLocale, navigatorLocale) => {
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

/**
 * List days ordered by the locale
 * @param {String} type Type of list
 * @return {Array}
 */
export const getDays = (type) => {
    const fun = type !== 'short' ? 'weekdays' : 'weekdaysShort';
    const list = moment[fun]().map((label, value) => ({ value, label }));

    if (!moment.localeData().firstDayOfWeek()) {
        return list;
    }
    // Move sunday as the last day of the week
    const [firstDay, ...days] = list;
    return days.concat(firstDay);
};
