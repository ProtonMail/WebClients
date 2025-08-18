import { getLocalesFromRequireContext } from '@proton/shared/lib/i18n/locales';

import { getLocaleMap } from '../static/localeMapping';

const requireContext = import.meta.webpackContext!('../../locales', {
    recursive: false,
    regExp: /\.json$/,
    mode: 'lazy',
    chunkName: 'locales/[request]',
});

const locales = getLocalesFromRequireContext(requireContext);

export const localeRegex = /^\/([a-z]{2,3}(-[a-z]{2})?)\/?/;

export const localeMap = Object.fromEntries(
    Object.entries(getLocaleMap(requireContext.keys().map((locale) => locale.replace('./', '')))).map(
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
