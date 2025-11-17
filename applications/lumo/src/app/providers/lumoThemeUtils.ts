import { ThemeModeSetting, ThemeTypes } from '@proton/shared/lib/themes/constants';

import type { LumoLocalSettings } from './lumoThemeStorage';
import { getDefaultSettings } from './lumoThemeStorage';

// @ts-ignore
import lumoDarkTheme from '@proton/colors/themes/dist/lumo-dark.theme.css';
// @ts-ignore
import lumoLightTheme from '@proton/colors/themes/dist/lumo-light.theme.css';

export type ThemeConfig = { styles: string };

export const getThemeConfig = (theme: ThemeTypes): ThemeConfig => {
    switch (theme) {
        case ThemeTypes.LumoDark:
            return { styles: lumoDarkTheme.toString() };
        case ThemeTypes.LumoLight:
        default:
            return { styles: lumoLightTheme.toString() };
    }
};

export const matchDarkTheme = () => window.matchMedia('(prefers-color-scheme: dark)');

export const getLumoDefaultTheme = (): ThemeTypes => {
    return matchDarkTheme().matches ? ThemeTypes.LumoDark : ThemeTypes.LumoLight;
};

export const getLumoThemeFromSettings = (settings: LumoLocalSettings, systemIsDark: boolean): ThemeTypes => {
    if (settings.mode === ThemeModeSetting.Auto) {
        return systemIsDark ? ThemeTypes.LumoDark : ThemeTypes.LumoLight;
    }
    return settings.theme;
};

export interface UserSettings {
    theme?: 'light' | 'dark' | 'auto';
}

// Convert Redux user settings to local settings format
export const userSettingsToLocalSettings = (
    userSettings: UserSettings | null,
    systemIsDark: boolean
): LumoLocalSettings => {
    if (!userSettings?.theme) {
        return getDefaultSettings();
    }

    switch (userSettings.theme) {
        case 'auto':
            return {
                theme: systemIsDark ? ThemeTypes.LumoDark : ThemeTypes.LumoLight,
                mode: ThemeModeSetting.Auto,
            };
        case 'dark':
            return {
                theme: ThemeTypes.LumoDark,
                mode: ThemeModeSetting.Dark,
            };
        case 'light':
        default:
            return {
                theme: ThemeTypes.LumoLight,
                mode: ThemeModeSetting.Light,
            };
    }
};

// Convert local settings to Redux user settings format
export const localSettingsToUserSettings = (settings: LumoLocalSettings): 'light' | 'dark' | 'auto' => {
    if (settings.mode === ThemeModeSetting.Auto) {
        return 'auto';
    }
    return settings.theme === ThemeTypes.LumoDark ? 'dark' : 'light';
};

// Create new settings for theme change
export const createThemeSettings = (newTheme: ThemeTypes): LumoLocalSettings => ({
    theme: newTheme,
    mode: newTheme === ThemeTypes.LumoDark ? ThemeModeSetting.Dark : ThemeModeSetting.Light,
});

// Create new settings for auto theme change
export const createAutoThemeSettings = (enabled: boolean, systemIsDark: boolean): LumoLocalSettings => {
    if (enabled) {
        return {
            theme: systemIsDark ? ThemeTypes.LumoDark : ThemeTypes.LumoLight,
            mode: ThemeModeSetting.Auto,
        };
    }
    return {
        theme: systemIsDark ? ThemeTypes.LumoDark : ThemeTypes.LumoLight,
        mode: systemIsDark ? ThemeModeSetting.Dark : ThemeModeSetting.Light,
    };
};
