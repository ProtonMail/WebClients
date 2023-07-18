import { enUSLocale } from './dateFnLocales';

/**
 * The locales are exported as mutable exports:
 * 1) To avoid using a react context for components deep in the tree
 * 2) It's more similar to how ttag works
 */
export let dateLocale = enUSLocale;
export let defaultDateLocale = enUSLocale;
export let browserDateLocale = enUSLocale;
export let dateLocaleCode = 'en_US';
export let browserLocaleCode = 'en_US';
export let localeCode = 'en_US';
export let languageCode = 'en';

export const setLocales = ({
    localeCode: newLocaleCode = localeCode,
    languageCode: newLanguageCode = languageCode,
}) => {
    localeCode = newLocaleCode;
    languageCode = newLanguageCode;
};

export const setDateLocales = ({
    defaultDateLocale: newDefaultDateLocale = defaultDateLocale,
    browserDateLocale: newBrowserDateLocale = browserDateLocale,
    browserLocaleCode: newBrowserLocaleCode = browserLocaleCode,
    dateLocale: newDateLocale = dateLocale,
    dateLocaleCode: newDateLocaleCode = dateLocaleCode,
}) => {
    defaultDateLocale = newDefaultDateLocale;
    browserDateLocale = newBrowserDateLocale;
    browserLocaleCode = newBrowserLocaleCode;
    dateLocale = newDateLocale;
    dateLocaleCode = newDateLocaleCode;
};
