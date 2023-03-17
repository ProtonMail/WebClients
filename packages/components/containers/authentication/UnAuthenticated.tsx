import { useLayoutEffect } from 'react';

import { PROTON_DEFAULT_THEME } from '@proton/shared/lib/themes/themes';

import { useTheme } from '../themes';

/*
 * Meant to wrap portions of ui that we know are for certain only
 * rendered if a user visits the app(s) while unauthenticated.
 */
const UnAuthenticated = ({ children }: { children: JSX.Element }) => {
    const [, setTheme] = useTheme();

    useLayoutEffect(() => {
        setTheme(PROTON_DEFAULT_THEME);
    }, []);

    return children;
};

export default UnAuthenticated;
