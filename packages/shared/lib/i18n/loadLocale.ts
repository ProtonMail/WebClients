import { addLocale as ttagAddLocale, useLocale as ttagUseLocale } from 'ttag';

import { DEFAULT_LOCALE } from '../constants';
import type { TtagLocaleMap } from '../interfaces/Locale';
import type { Options } from './dateFnLocale';
import { getDateFnLocaleWithLongFormat, getDateFnLocaleWithSettings } from './dateFnLocale';
import dateFnLocales, { getDateFnLocale } from './dateFnLocales';
import { getBrowserLocale, getClosestLocaleCode, getLangAttribute, getLanguageCode } from './helper';
import { browserLocaleCode, dateLocaleCode, localeCode, setDateLocales, setLocales } from './index';

export const willLoadLocale = (localeCode: string) => {
    return localeCode !== DEFAULT_LOCALE;
};

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

    if (typeof document !== 'undefined') {
        document.documentElement.lang = getLangAttribute(localeCode);
    }
};

export const loadDateLocale = async (localeCode: string, browserLocaleCode?: string, options?: Options) => {
    const closestLocaleCode = getClosestLocaleCode(localeCode, dateFnLocales);
    const closestBrowserLocaleCode = getClosestLocaleCode(browserLocaleCode, dateFnLocales);
    const [dateFnLocale, browserDateFnLocale] = await Promise.all([
        getDateFnLocale(closestLocaleCode),
        getDateFnLocale(closestBrowserLocaleCode),
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

export const loadLocales = async ({
    locale: newLocale,
    browserLocaleCode: newBrowserLocaleCode = getBrowserLocale(),
    locales,
    userSettings,
}: {
    locale: string;
    browserLocaleCode?: string;
    locales: TtagLocaleMap;
    userSettings: Options | undefined;
}) => {
    const promises: Promise<any>[] = [];

    const closestLocaleCode = getClosestLocaleCode(newLocale, locales);
    if (localeCode !== closestLocaleCode) {
        promises.push(loadLocale(closestLocaleCode, locales));
    }

    const closestDateFnLocaleCode = getClosestLocaleCode(closestLocaleCode, dateFnLocales);
    const closestBrowserLocaleCode = getClosestLocaleCode(newBrowserLocaleCode, dateFnLocales);
    if (dateLocaleCode !== closestDateFnLocaleCode || browserLocaleCode !== closestBrowserLocaleCode) {
        promises.push(loadDateLocale(closestLocaleCode, closestBrowserLocaleCode, userSettings));
    }

    await Promise.all(promises);

    return { update: promises.length >= 1, localeCode: closestLocaleCode };
};
