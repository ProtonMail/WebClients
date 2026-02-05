import { getStoredThemeString } from '@proton/components/containers/themes/themeCookieStorage';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { ThemeModeSetting } from '@proton/shared/lib/themes/constants';
import {
    PROTON_DEFAULT_THEME,
    type ThemeSetting,
    getDefaultThemeSetting,
    getParsedThemeSetting,
} from '@proton/shared/lib/themes/themes';

import { getThemeFromLocation } from './getThemeFromLocation';
import { PUBLIC_THEME_DARK, PUBLIC_THEME_LIGHT, getThemeSettingFromMode } from './getThemeSettingFromMode';
import { getThemeModeFromStorage } from './publicThemeStorage';

const getThemeModeSettingFromString = (value: string | null | undefined): ThemeModeSetting | undefined => {
    switch (value) {
        case 'light':
            return ThemeModeSetting.Light;
        case 'dark':
            return ThemeModeSetting.Dark;
        case 'auto':
            return ThemeModeSetting.Auto;
    }
};

const getThemeFromCookie = (defaultThemeSetting: ThemeSetting) => {
    const cookieTheme = getStoredThemeString();
    if (cookieTheme !== undefined) {
        const parsedCookieTheme = getParsedThemeSetting(cookieTheme);
        // User explicitly chose AUTO - respect cookie's Mode for the actual theme,
        // but set Mode to AUTO so dropdown shows AUTO.
        const isDark = parsedCookieTheme.Mode === ThemeModeSetting.Dark;
        const isAuto = parsedCookieTheme.Mode === ThemeModeSetting.Auto;
        const theme = isDark ? PUBLIC_THEME_DARK : PUBLIC_THEME_LIGHT;
        return {
            ...defaultThemeSetting,
            Mode: ThemeModeSetting.Auto,
            LightTheme: isAuto ? PUBLIC_THEME_LIGHT : theme,
            DarkTheme: isAuto ? PUBLIC_THEME_DARK : theme,
        };
    }
};

// This function is called on initial load and when changing themes
export const getPublicAppThemeSetting = ({ themeMode }: { themeMode: ThemeModeSetting | undefined }): ThemeSetting => {
    const defaultThemeSetting = getDefaultThemeSetting(PROTON_DEFAULT_THEME);

    if (themeMode !== undefined) {
        // 4. In case the public theme is set to auto, use the cookie preference if it exists
        if (themeMode === ThemeModeSetting.Auto) {
            const cookieTheme = getThemeFromCookie(defaultThemeSetting);
            if (cookieTheme !== undefined) {
                return cookieTheme;
            }
        }

        // 3. PublicTheme local storage (in case it's set to light or dark)
        return { ...defaultThemeSetting, ...getThemeSettingFromMode(themeMode) };
    }

    // 4. In case no public theme has been set, use the cookie preference
    const cookieTheme = getThemeFromCookie(defaultThemeSetting);
    if (cookieTheme !== undefined) {
        return cookieTheme;
    }

    // 5. System preference
    return { ...defaultThemeSetting, ...getThemeSettingFromMode(ThemeModeSetting.Light) };
};

// This function is called once on initial load
// Priority order:
// 1. URL param (?theme=light/dark/auto)
// 2. Location based
// 3. PublicTheme local storage (in case it's set to light or dark)
// 4. Theme cookie from user's account settings
// 5. System preference
export const getInitialPublicAppThemeSetting = (): ThemeSetting => {
    const defaultThemeSetting = getDefaultThemeSetting(PROTON_DEFAULT_THEME);
    const searchParams = new URLSearchParams(window.location.search);

    // 1. Location based
    const themeFromLocation = getThemeFromLocation(window.location, searchParams);
    if (themeFromLocation !== null) {
        return { ...defaultThemeSetting, ...themeFromLocation };
    }

    if (isElectronApp) {
        return defaultThemeSetting;
    }

    // 2. URL param (?theme=light/dark/auto)
    const paramThemeMode = getThemeModeSettingFromString(searchParams.get('theme'));
    if (paramThemeMode !== undefined) {
        return { ...defaultThemeSetting, ...getThemeSettingFromMode(paramThemeMode) };
    }

    // 3. PublicTheme local storage (in case it's set to light or dark)
    const storedThemeMode = getThemeModeFromStorage();
    return getPublicAppThemeSetting({ themeMode: storedThemeMode });
};

// Persist the theme to cookie in case there's no other theme present, this slightly improves the experience for users
// who pick dark and then load an app for the first time
export const getShouldPersistTheme = () => {
    return !Boolean(getStoredThemeString());
};
