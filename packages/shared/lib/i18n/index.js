/* eslint-disable import/no-mutable-exports,prefer-destructuring */
import { enUSLocale } from './dateFnLocales';

/**
 * The locales are exported as mutable exports:
 * 1) To avoid using a react context for components deep in the tree
 * 2) It's more similar to how ttag works
 */
export let dateLocale = enUSLocale;
export let dateLocaleCode = 'en_US';
export let longDateLocaleCode = 'en_US';
export let localeCode = 'en_US';
export let languageCode = 'en';

export const setLocales = ({
    dateLocale: newDateLocale = dateLocale,
    dateLocaleCode: newDateLocaleCode = dateLocaleCode,
    longDateLocaleCode: newLongDateLocaleCode = longDateLocaleCode,
    localeCode: newLocaleCode = localeCode,
    languageCode: newLanguageCode = languageCode
}) => {
    dateLocale = newDateLocale;
    dateLocaleCode = newDateLocaleCode;
    longDateLocaleCode = newLongDateLocaleCode;
    localeCode = newLocaleCode;
    languageCode = newLanguageCode;
};
