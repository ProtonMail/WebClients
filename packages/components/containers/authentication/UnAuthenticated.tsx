import { ReactNode, useLayoutEffect } from 'react';

import { useTheme } from '../themes';

/*
 * Meant to wrap portions of ui that we know are for certain only
 * rendered if a user visits the app(s) while unauthenticated.
 */
const UnAuthenticated = ({ children }: { children: ReactNode }) => {
    const theme = useTheme();

    useLayoutEffect(() => {
        theme.setThemeSetting();
    }, []);

    return <>{children}</>;
};

export default UnAuthenticated;
