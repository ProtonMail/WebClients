import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useTheme } from '@proton/components';
import { ThemeTypes } from '@proton/shared/lib/themes/constants';

const getThemeFromSearchParams = (params: URLSearchParams): ThemeTypes | null => {
    const theme = params.get('theme');
    if (theme === 'dark') {
        return ThemeTypes.Carbon;
    }
    return null;
};

export const useLoginTheme = () => {
    const location = useLocation();
    const theme = useTheme();

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const themeFromParams = getThemeFromSearchParams(searchParams);
        if (themeFromParams !== null) {
            theme.setTheme(themeFromParams);
        }
    }, [location.search, theme]);
};
