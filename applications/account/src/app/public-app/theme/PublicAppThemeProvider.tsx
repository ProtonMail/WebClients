import type { ReactNode } from 'react';

import { APPS } from '@proton/shared/lib/constants';
import ThemeProvider from '@proton/theme/ThemeProvider';

import { getPublicAppThemeSetting, getShouldPersistTheme } from './getPublicAppThemeSetting';

export const PublicAppThemeProvider = ({ children }: { children: ReactNode }) => {
    return (
        <ThemeProvider
            appName={APPS.PROTONACCOUNT}
            persist={getShouldPersistTheme()}
            initialThemeSetting={getPublicAppThemeSetting}
        >
            {children}
        </ThemeProvider>
    );
};
