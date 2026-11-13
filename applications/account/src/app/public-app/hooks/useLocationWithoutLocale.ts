import { useHistory, useLocation } from 'react-router-dom';

import type { Location } from 'history';

import { stripLocaleTagPrefix } from '../localePrefix';

export const getLocalePathPrefix = (localePrefix: string | undefined) => {
    return localePrefix ? `/${localePrefix}` : '';
};

const useLocationWithoutLocale = <T>(): Location<T> & { localePrefix: string; fullLocale: string } => {
    const locationWithLocale = useLocation<T>();
    const history = useHistory();
    // Under PublicAppStandaloneRoutes' <Switch>, useLocation() is already without the locale: take it from the URL
    const { fullLocale, localePrefix } = stripLocaleTagPrefix(history.location.pathname);
    const { pathname } = stripLocaleTagPrefix(locationWithLocale.pathname);

    return {
        ...locationWithLocale,
        pathname,
        localePrefix,
        fullLocale,
    };
};

export default useLocationWithoutLocale;
