import { type ThemeModeSetting, ThemeTypes } from '@proton/theme/constants';
import type { ThemeSetting } from '@proton/theme/themes';

export const PUBLIC_THEME_LIGHT = ThemeTypes.Duotone;
export const PUBLIC_THEME_DARK = ThemeTypes.Carbon;

export const getThemeSettingFromMode = (themeMode: ThemeModeSetting): Partial<ThemeSetting> => {
    return {
        Mode: themeMode,
        LightTheme: PUBLIC_THEME_LIGHT,
        DarkTheme: PUBLIC_THEME_DARK,
    };
};
