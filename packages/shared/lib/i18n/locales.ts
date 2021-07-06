import { LocaleData } from 'ttag';
import { TtagLocaleMap } from '../interfaces/Locale';

export let locales: TtagLocaleMap = {};

export const getLocalesFromRequireContext = (locales: { keys: () => string[]; (id: string): Promise<LocaleData> }) => {
    return locales.keys().reduce<TtagLocaleMap>((acc, key) => {
        acc[key.slice(2, key.length - 5)] = () => locales(key);
        return acc;
    }, {});
};

export const setLocales = (newLocales: TtagLocaleMap) => {
    locales = newLocales;
};

export const initLocales = (locales: { keys: () => string[]; (id: string): Promise<LocaleData> }): TtagLocaleMap => {
    const newLocales = getLocalesFromRequireContext(locales);
    setLocales(newLocales);
    return newLocales;
};
