import { useLocation } from 'react-router-dom';

import type { Location } from 'history';

import { stripLocaleTagPrefix } from '../localePrefix';

export const getLocalePathPrefix = (localePrefix: string | undefined) => {
    return localePrefix ? `/${localePrefix}` : '';
};

const useLocationWithoutLocale = <T>(): Location<T> & { localePrefix: string; fullLocale: string } => {
    const locationWithLocale = useLocation<T>();

    const { fullLocale, localePrefix, pathname } = stripLocaleTagPrefix(locationWithLocale.pathname);

    return {
        ...locationWithLocale,
        pathname,
        localePrefix,
        fullLocale,
    };
};

export default useLocationWithoutLocale;
