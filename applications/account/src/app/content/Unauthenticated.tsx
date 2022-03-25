import { useLayoutEffect } from 'react';

import { useTheme } from '@proton/components';
import { ThemeTypes } from '@proton/shared/lib/themes/themes';

/*
 * Meant to wrap portions of ui that we know are for certain only
 * rendered if a user visits the app(s) while unauthenticated.
 */
const Unauthenticated = ({ children }: { children: JSX.Element }) => {
    const [, setTheme] = useTheme();

    useLayoutEffect(() => {
        setTheme(ThemeTypes.Default);
    }, []);

    return children;
};

export default Unauthenticated;
