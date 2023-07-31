import { addLocale as ttagAddLocale, useLocale as ttagUseLocale } from 'ttag';

import { DEFAULT_LOCALE } from '../constants';
import { TtagLocaleMap } from '../interfaces/Locale';
import { Options, getDateFnLocaleWithLongFormat, getDateFnLocaleWithSettings } from './dateFnLocale';
import dateFnLocales from './dateFnLocales';
import { getClosestLocaleMatch, getLangAttribute, getLanguageCode } from './helper';
import { setDateLocales, setLocales } from './index';

export const loadLocale = async (localeCode: string, locales: TtagLocaleMap) => {
    const languageCode = getLanguageCode(localeCode);

    if (localeCode !== DEFAULT_LOCALE) {
        const getLocaleData = locales[localeCode];
        if (!getLocaleData) {
            throw new Error('No locale data for requested localeCode');
        }
        const data = await getLocaleData();
        ttagAddLocale(localeCode, data);
    }
    ttagUseLocale(localeCode);

    setLocales({
        localeCode,
        languageCode,
    });

    document.documentElement.lang = getLangAttribute(localeCode);
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
        browserLocaleCode: closestBrowserLocaleCode,
        dateLocale: updatedDateFnLocale,
        dateLocaleCode: closestLocaleCode,
    });

    return updatedDateFnLocale;
};
