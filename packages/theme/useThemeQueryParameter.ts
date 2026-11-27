import { useLayoutEffect, useRef } from 'react';

import { useTheme } from './ThemeProvider';
import { ThemeTypes } from './constants';
import { PROTON_DEFAULT_THEME } from './themes';

const getThemeFromQueryParameter = (): ThemeTypes | undefined => {
    const queryParams = new URLSearchParams(location.search);
    const themeQueryParam = queryParams.get('theme');

    if (!themeQueryParam) {
        return undefined;
    }

    const themeAsNumber = Number(themeQueryParam) as ThemeTypes;
    if (!Object.values(ThemeTypes).includes(themeAsNumber)) {
        return undefined;
    }

    return themeAsNumber;
};

/**
 * Sets the current theme to use based on a `theme`
 * query parameter.
 *
 * On first load, if no parameter is provided, or isn't a value in
 * ThemeTypes, then it uses the default theme.
 *
 * Afterwards, a URL without a valid `theme` (e.g. after navigating
 * to a subpage) keeps the last applied theme.
 */
const useThemeQueryParameter = () => {
    const theme = useTheme();
    const appliedThemeRef = useRef<ThemeTypes | undefined>(undefined);

    const appliedTheme = getThemeFromQueryParameter() ?? appliedThemeRef.current ?? PROTON_DEFAULT_THEME;

    useLayoutEffect(() => {
        appliedThemeRef.current = appliedTheme;
        theme.setTheme(appliedTheme);
    }, [appliedTheme]);

    return appliedTheme;
};

export default useThemeQueryParameter;
