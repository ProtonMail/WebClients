import { useLayoutEffect } from 'react';

import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import type { ThemeTypes } from '@proton/shared/lib/themes/constants';

export const SetTheme = ({ theme: maybeTheme }: { theme?: ThemeTypes }) => {
    const theme = useTheme();

    useLayoutEffect(() => {
        theme.setThemeSetting();
        if (maybeTheme !== undefined) {
            theme.setTheme(maybeTheme);
        }
    }, [maybeTheme]);

    return null;
};
