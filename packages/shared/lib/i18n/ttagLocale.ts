import { addLocale, useLocale } from 'ttag';

import { DEFAULT_LOCALE } from '../constants';
import { TtagLocaleMap } from '../interfaces/Locale';

interface Config {
    locale: string;
    locales: TtagLocaleMap;
}

export const loadTtagLocale = async ({ locale, locales }: Config) => {
    if (locale !== DEFAULT_LOCALE) {
        const data = await locales[locale]();
        addLocale(locale, data);
    }
    useLocale(locale);
};
