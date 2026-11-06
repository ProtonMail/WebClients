import type { ReactNode } from 'react';

import { c } from 'ttag';

import { getStoredThemeString } from '@proton/components/containers/themes/themeCookieStorage';
import { IcCircleHalfFilled } from '@proton/icons/icons/IcCircleHalfFilled';
import { IcMoon } from '@proton/icons/icons/IcMoon';
import { IcSun } from '@proton/icons/icons/IcSun';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { ThemeModeSetting } from '@proton/shared/lib/themes/constants';

const getAutoModeDescription = () => {
    const cookieTheme = getStoredThemeString();
    if (cookieTheme !== undefined) {
        return () => c('Theme').t`Use ${BRAND_NAME} settings`;
    }
    return () => c('Theme').t`Sync with system`;
};

export const publicThemeModeConfig: Record<
    ThemeModeSetting,
    { label: () => string; description?: () => string; icon: ReactNode; next: ThemeModeSetting; value: string }
> = {
    [ThemeModeSetting.Light]: {
        // Translator: Light as in "Light theme" for the ui
        label: () => c('Theme').t`Light`,
        icon: <IcSun title={c('Theme').t`Mode: Light`} />,
        next: ThemeModeSetting.Dark,
        value: 'light',
    },
    [ThemeModeSetting.Dark]: {
        // Translator: Dark as in "Dark theme" for the ui
        label: () => c('Theme').t`Dark`,
        icon: <IcMoon title={c('Theme').t`Mode: Dark`} />,
        next: ThemeModeSetting.Auto,
        value: 'dark',
    },
    [ThemeModeSetting.Auto]: {
        // Translator: Auto as in "Automatic theme" for the ui
        label: () => c('Theme').t`Auto`,
        description: getAutoModeDescription(),
        icon: <IcCircleHalfFilled title={c('Theme').t`Mode: Auto`} />,
        next: ThemeModeSetting.Light,
        value: 'auto',
    },
};
