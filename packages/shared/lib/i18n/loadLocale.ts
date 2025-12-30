import isDeepEqual from 'lodash/isEqual';
import { addLocale as ttagAddLocale, useLocale as ttagUseLocale } from 'ttag';

import { pick } from '@proton/shared/lib/helpers/object';

import { DEFAULT_LOCALE } from '../constants';
import type { DateFormatOptions, TtagLocaleMap } from '../interfaces/Locale';
import { getDateFnLocaleWithLongFormat, getDateFnLocaleWithSettings } from './dateFnLocale';
import dateFnLocales, { getDateFnLocale } from './dateFnLocales';
import { getBrowserLocale, getClosestLocaleCode, getLangAttribute, getLanguageCode } from './helper';
import { browserLocaleCode, dateFormatOptions, dateLocaleCode, localeCode, setDateLocales, setLocales } from './index';

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

// Pick these keys to ensure that the complete user settings object isn't stored.
export const getPickedDateFormatOptions = (dateFormatOptions: DateFormatOptions | undefined) => {
    if (!dateFormatOptions) {
        return;
    }
    return pick(dateFormatOptions, ['TimeFormat', 'DateFormat', 'WeekStart']);
};

export const loadDateLocale = async (
    localeCode: string,
    browserLocaleCode?: string,
    dateFormatOptions?: DateFormatOptions
) => {
    const closestLocaleCode = getClosestLocaleCode(localeCode, dateFnLocales);
    const closestBrowserLocaleCode = getClosestLocaleCode(browserLocaleCode, dateFnLocales);
    const [dateFnLocale, browserDateFnLocale] = await Promise.all([
        getDateFnLocale(closestLocaleCode),
        getDateFnLocale(closestBrowserLocaleCode),
    ]);
    const mergedDateLocale = getDateFnLocaleWithLongFormat(dateFnLocale, browserDateFnLocale);
    // This function is also called outside of `loadLocales` so recalling it.
    const pickedDateFormatOptions = getPickedDateFormatOptions(dateFormatOptions);
    const updatedDateFnLocale = getDateFnLocaleWithSettings(mergedDateLocale, pickedDateFormatOptions);

    setDateLocales({
        defaultDateLocale: dateFnLocale,
        browserDateLocale: browserDateFnLocale,
        browserLocaleCode: closestBrowserLocaleCode,
        dateLocale: updatedDateFnLocale,
        dateLocaleCode: closestLocaleCode,
        dateFormatOptions: pickedDateFormatOptions,
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
    userSettings: DateFormatOptions | undefined;
}) => {
    const promises: Promise<any>[] = [];

    const closestLocaleCode = getClosestLocaleCode(newLocale, locales);
    if (localeCode !== closestLocaleCode) {
        promises.push(loadLocale(closestLocaleCode, locales));
    }

    const closestDateFnLocaleCode = getClosestLocaleCode(closestLocaleCode, dateFnLocales);
    const closestBrowserLocaleCode = getClosestLocaleCode(newBrowserLocaleCode, dateFnLocales);
    // Picking this just to ensure that the whole user settings object isn't stored
    const pickedDateFormatOptions = getPickedDateFormatOptions(userSettings);
    const settingsDiff = !isDeepEqual(pickedDateFormatOptions, dateFormatOptions);
    if (dateLocaleCode !== closestDateFnLocaleCode || browserLocaleCode !== closestBrowserLocaleCode || settingsDiff) {
        promises.push(loadDateLocale(closestLocaleCode, closestBrowserLocaleCode, pickedDateFormatOptions));
    }

    await Promise.all(promises);

    return { update: promises.length >= 1, localeCode: closestLocaleCode };
};
