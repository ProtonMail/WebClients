import type { ReactNode } from 'react';

import { getThemeStyle } from '@proton/components/containers/themes/ThemeProvider';
import type { APP_NAMES } from '@proton/shared/lib/constants';

type BookingThemeProviderProps = { children: ReactNode; appName: APP_NAMES };

export const BookingThemeProvider = ({ children }: BookingThemeProviderProps) => {
    const THEME_ID = 'theme-root';
    const DEFAULT_THEME_STYLES = getThemeStyle();

    return (
        <>
            <style id={THEME_ID}>{DEFAULT_THEME_STYLES}</style>
            {children}
        </>
    );
};
