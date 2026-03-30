import { createLocaleMap } from '@proton/shared/lib/i18n/locales';
import { getProtonConfig } from '@proton/shared/lib/interfaces/config';

import { getLocaleMap } from '../static/localeMapping';

const locales = createLocaleMap(
    (locale) => import(/* webpackChunkName: "locales/[request]" */ `../../locales/${locale}.json`)
);

export const localeRegex = /^\/([a-z]{2,3}(-[a-z]{2})?)\/?/;

export const localeMap = Object.fromEntries(
    Object.entries(getLocaleMap(Object.keys(getProtonConfig().LOCALES).map((locale) => `${locale}.json`))).map(
        ([key, value]) => [value, key]
    )
);

export const getLocaleMapping = (localeCode: string) => {
    return Object.entries(localeMap).find(([, otherLocaleCode]) => otherLocaleCode === localeCode)?.[0];
};

export const stripLocaleTagPrefix = (pathname: string) => {
    const [, localePrefix] = pathname.match(localeRegex) || [];

    const fullLocale = localeMap[localePrefix];
    if (!fullLocale) {
        return {
            fullLocale: '',
            localePrefix: '',
            pathname: pathname || '/',
        };
    }

    return {
        fullLocale,
        localePrefix,
        pathname: pathname.replace(`/${localePrefix}`, '') || '/',
    };
};

export default locales;
