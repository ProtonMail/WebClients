import type { ReactNode } from 'react';

import { getThemeStyle } from '@proton/components/containers/themes/ThemeProvider';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import { BookingAuthApp } from './authenticated/BookingAuthApp';
import { BookingGuestApp } from './guest/BookingGuestApp';

// theme provider for booking
// --------------
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

export const BookingsEntry = () => {
    // Quick check to redirect the user to the guest app if they are not authenticated
    if (window.location.pathname.includes('/guest')) {
        return <BookingGuestApp />;
    } else {
        return <BookingAuthApp />;
    }
};
