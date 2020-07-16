import dateFnLocales from './dateFnLocales';
import { setLocales } from './index';
import { loadTtagLocale } from './ttagLocale';
import { loadDateFnLocale } from './dateFnLocale';
import { TtagLocaleMap } from '../interfaces/Locale';

interface Config {
    localeCode: string;
    dateLocaleCode: string;
    longDateLocaleCode: string;
    languageCode: string;
    locales: TtagLocaleMap;
}

/**
 * Load a new ttag and date-fn locale in the app.
 */
export default async ({ localeCode, dateLocaleCode, longDateLocaleCode, languageCode, locales }: Config) => {
    const [dateLocale] = await Promise.all([
        loadDateFnLocale({
            locale: dateLocaleCode,
            longLocale: longDateLocaleCode,
            locales: dateFnLocales,
        }),
        loadTtagLocale({
            locale: localeCode,
            locales,
        }),
    ]);

    setLocales({
        localeCode,
        dateLocaleCode,
        longDateLocaleCode,
        languageCode,
        dateLocale,
    });

    document.documentElement.lang = languageCode;
};
