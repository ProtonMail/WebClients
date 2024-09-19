import type { ReactNode } from 'react';
import { useLayoutEffect } from 'react';

import type { ThemeTypes } from '@proton/shared/lib/themes/themes';

import { useTheme } from '../themes/ThemeProvider';

/*
 * Meant to wrap portions of ui that we know are for certain only
 * rendered if a user visits the app(s) while unauthenticated.
 */
const UnAuthenticated = ({ children, theme: maybeTheme }: { children: ReactNode; theme?: ThemeTypes }) => {
    const theme = useTheme();

    useLayoutEffect(() => {
        theme.setThemeSetting();
        if (maybeTheme !== undefined) {
            theme.setTheme(maybeTheme);
        }
    }, [maybeTheme]);

    return <>{children}</>;
};

export default UnAuthenticated;
