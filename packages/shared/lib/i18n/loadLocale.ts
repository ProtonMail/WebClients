import { addLocale as ttagAddLocale, useLocale as ttagUseLocale } from 'ttag';
import dateFnLocales from './dateFnLocales';
import { setDateLocales, setLocales } from './index';
import { getDateFnLocaleWithLongFormat, getDateFnLocaleWithSettings, Options } from './dateFnLocale';
import { TtagLocaleMap } from '../interfaces/Locale';
import { DEFAULT_LOCALE } from '../constants';
import { getClosestLocaleMatch, getLanguageCode } from './helper';

export const loadLocale = async (localeCode: string, locales: TtagLocaleMap) => {
    const languageCode = getLanguageCode(localeCode);

    if (localeCode !== DEFAULT_LOCALE) {
        const data = await locales[localeCode]();
        ttagAddLocale(localeCode, data);
    }
    ttagUseLocale(localeCode);

    setLocales({
        localeCode,
        languageCode,
    });

    document.documentElement.lang = languageCode;
};

export const loadDateLocale = async (localeCode: string, browserLocaleCode?: string, options?: Options) => {
    const closestLocaleCode = getClosestLocaleMatch(localeCode, dateFnLocales) || DEFAULT_LOCALE;
    const closestBrowserLocaleCode = getClosestLocaleMatch(browserLocaleCode, dateFnLocales) || DEFAULT_LOCALE;
    const [dateFnLocale, browserDateFnLocale] = await Promise.all([
        dateFnLocales[closestLocaleCode](),
        dateFnLocales[closestBrowserLocaleCode](),
    ]);
    const mergedDateLocale = getDateFnLocaleWithLongFormat(dateFnLocale, browserDateFnLocale);
    const updatedDateFnLocale = getDateFnLocaleWithSettings(mergedDateLocale, options);

    setDateLocales({
        defaultDateLocale: dateFnLocale,
        browserDateLocale: browserDateFnLocale,
        dateLocale: updatedDateFnLocale,
        dateLocaleCode: closestLocaleCode,
    });

    return updatedDateFnLocale;
};
