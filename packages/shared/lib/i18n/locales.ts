import { LocaleData } from 'ttag';

import { TtagLocaleMap } from '../interfaces/Locale';

export let locales: TtagLocaleMap = {};

type LocaleRequireContext = { keys: () => string[]; (id: string): Promise<LocaleData> };

export const getLocalesFromRequireContext = (locales: LocaleRequireContext) => {
    return locales.keys().reduce<TtagLocaleMap>((acc, key) => {
        acc[key.slice(2, key.length - 5)] = () => locales(key);
        return acc;
    }, {});
};

export const setTtagLocales = (newLocales: TtagLocaleMap) => {
    locales = newLocales;
};
