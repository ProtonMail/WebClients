import { addLocale, useLocale } from 'ttag';

import { DEFAULT_LOCALE } from '../constants';

export const loadTtagLocale = async ({ locale, locales }) => {
    if (locale !== DEFAULT_LOCALE) {
        const data = await locales[locale]();
        addLocale(locale, data);
    }
    useLocale(locale);
};
