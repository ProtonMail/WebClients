import dateFnLocales from './dateFnLocales';
import { setLocales } from './index';
import { loadTtagLocale } from './ttagLocale';
import { loadDateFnLocale } from './dateFnLocale';

/**
 * Load a new ttag and date-fn locale in the app.
 * @param {String} localeCode
 * @param {String} dateLocaleCode
 * @param {String} longDateLocaleCode
 * @param {String} languageCode
 * @param {Object} locales
 * @return {Promise}
 */
export default async ({ localeCode, dateLocaleCode, longDateLocaleCode, languageCode, locales }) => {
    const [dateLocale] = await Promise.all([
        loadDateFnLocale({
            locale: dateLocaleCode,
            longLocale: longDateLocaleCode,
            locales: dateFnLocales
        }),
        loadTtagLocale({
            locale: localeCode,
            language: languageCode,
            locales
        })
    ]);

    setLocales({
        localeCode,
        dateLocaleCode,
        longDateLocaleCode,
        languageCode,
        dateLocale
    });

    document.documentElement.lang = languageCode;
};
