import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useTheme } from '@proton/components/containers/themes/ThemeProvider';

import { getPublicAppThemeSetting } from './getPublicAppThemeSetting';

/**
 * Syncs the theme when the location changes (e.g., navigating from login to signup).
 */
export const LocationThemeSync = () => {
    const location = useLocation();
    const theme = useTheme();

    useEffect(() => {
        theme.setThemeSetting(getPublicAppThemeSetting());
    }, [location.pathname]);

    return null;
};
