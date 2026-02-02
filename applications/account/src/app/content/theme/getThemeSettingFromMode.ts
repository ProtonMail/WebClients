import { type ThemeModeSetting, ThemeTypes } from '@proton/shared/lib/themes/constants';
import type { ThemeSetting } from '@proton/shared/lib/themes/themes';

export const PUBLIC_THEME_LIGHT = ThemeTypes.Duotone;
export const PUBLIC_THEME_DARK = ThemeTypes.Carbon;

export const getThemeSettingFromMode = (themeMode: ThemeModeSetting): Partial<ThemeSetting> => {
    return {
        Mode: themeMode,
        LightTheme: PUBLIC_THEME_LIGHT,
        DarkTheme: PUBLIC_THEME_DARK,
    };
};
