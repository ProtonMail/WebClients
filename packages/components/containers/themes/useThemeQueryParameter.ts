import { useLayoutEffect } from 'react';

import { ThemeTypes } from '@proton/shared/lib/themes/constants';
import { PROTON_DEFAULT_THEME } from '@proton/shared/lib/themes/themes';

import { useTheme } from './ThemeProvider';

/**
 * Sets the current theme to use based on a `theme`
 * query parameter .
 *
 * If no parameter is provide, or isn't a value in
 * ThemeTypes, then it uses the default theme.
 */
const useThemeQueryParameter = () => {
    const theme = useTheme();

    const parsedTheme = (() => {
        const queryParams = new URLSearchParams(location.search);
        const themeQueryParam = queryParams.get('theme');

        if (!themeQueryParam) {
            return PROTON_DEFAULT_THEME;
        }

        const themeAsNumber = Number(themeQueryParam) as ThemeTypes;
        if (!Object.values(ThemeTypes).includes(themeAsNumber)) {
            return PROTON_DEFAULT_THEME;
        }

        return themeAsNumber;
    })();

    useLayoutEffect(() => {
        theme.setTheme(parsedTheme);
    }, [parsedTheme]);

    return parsedTheme;
};

export default useThemeQueryParameter;
