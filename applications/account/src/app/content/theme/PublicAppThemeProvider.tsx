import type { ReactNode } from 'react';

import ThemeProvider from '@proton/components/containers/themes/ThemeProvider';
import { APPS } from '@proton/shared/lib/constants';

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
