import { type FC, type PropsWithChildren, createContext, useContext, useLayoutEffect, useState } from 'react';

import { ThemeModeSetting, ThemeTypes } from '@proton/shared/lib/themes/constants';
import useFlag from '@proton/unleash/useFlag';

// @ts-ignore
import lumoDarkTheme from '@proton/colors/themes/dist/lumo-dark.theme.css';
// @ts-ignore
import lumoLightTheme from '@proton/colors/themes/dist/lumo-light.theme.css';

export const LUMO_THEME_ID = 'lumo-theme';

export { ThemeTypes };

type ThemeConfig = { className: string; styles: string };

const getThemeConfig = (theme: ThemeTypes): ThemeConfig => {
    switch (theme) {
        case ThemeTypes.LumoLight:
            return { className: 'lumo-light', styles: lumoLightTheme.toString() };
        case ThemeTypes.LumoDark:
            return { className: 'lumo-dark', styles: lumoDarkTheme.toString() };
        default:
            return { className: 'lumo-light', styles: lumoLightTheme.toString() };
    }
};

const matchDarkTheme = () => window.matchMedia('(prefers-color-scheme: dark)');

export const getLumoDefaultTheme = (): ThemeTypes => {
    return matchDarkTheme().matches ? ThemeTypes.LumoDark : ThemeTypes.LumoLight;
};

const getLumoThemeFromSettings = (settings: LumoLocalSettings, systemIsDark: boolean): ThemeTypes => {
    if (settings.mode === ThemeModeSetting.Auto) {
        return systemIsDark ? ThemeTypes.LumoDark : ThemeTypes.LumoLight;
    }
    return settings.theme;
};

// Local storage helpers - similar to wallet implementation
const LUMO_SETTINGS_KEY = 'lumo-settings';

export interface LumoLocalSettings {
    theme: ThemeTypes;
    mode: ThemeModeSetting;
}

const getLocalID = (url = window.location.href): string | null => {
    try {
        const pathName = new URL(url).pathname;
        const match = pathName.match(/\/u\/(\d+)\//);
        return match ? match[1] : null;
    } catch {
        return null;
    }
};

/**
 * Get Lumo local settings key - user-specific like wallet
 */
const getLumoSettingsKey = () => {
    const localID = getLocalID();
    return localID ? `${LUMO_SETTINGS_KEY}:${localID}` : LUMO_SETTINGS_KEY;
};

/**
 * Get Lumo local settings from localStorage
 */
export const getLumoSettings = (): LumoLocalSettings | null => {
    try {
        const storage = localStorage.getItem(getLumoSettingsKey());
        if (storage) {
            const parsed = JSON.parse(storage);
            if (parsed && typeof parsed.theme === 'number' && typeof parsed.mode === 'number') {
                return parsed;
            }
        }
    } catch {
        // Ignore localStorage errors
    }
    return null;
};

/**
 * Save Lumo local settings to localStorage
 */
export const setLumoSettings = (settings: LumoLocalSettings) => {
    try {
        localStorage.setItem(getLumoSettingsKey(), JSON.stringify(settings));
    } catch {
        // Ignore localStorage errors
    }
};

/**
 * Clear Lumo local settings
 */
export const clearLumoSettings = () => {
    try {
        localStorage.removeItem(getLumoSettingsKey());
    } catch {
        // Ignore localStorage errors
    }
};

export const LumoThemeContext = createContext<{
    theme: ThemeTypes;
    setTheme: (theme: ThemeTypes) => void;
    setAutoTheme: (enabled: boolean) => void;
    isDarkLumoTheme: boolean;
    isAutoMode: boolean;
}>({
    theme: getLumoDefaultTheme(),
    setTheme: () => {},
    setAutoTheme: () => {},
    isDarkLumoTheme: false,
    isAutoMode: false,
});

export const LumoThemeProvider: FC<PropsWithChildren> = ({ children }) => {
    const isLumoDarkModeEnabled = useFlag('LumoDarkMode');

    // Single source of truth for settings
    const [settings, setSettings] = useState<LumoLocalSettings>(() => {
        const saved = getLumoSettings();
        return saved || { theme: getLumoDefaultTheme(), mode: ThemeModeSetting.Light };
    });

    // Track system preference
    const [systemIsDark, setSystemIsDark] = useState(() => matchDarkTheme().matches);

    const theme = getLumoThemeFromSettings(settings, systemIsDark);
    const config = getThemeConfig(theme);
    const isDarkLumoTheme = theme === ThemeTypes.LumoDark;
    const isAutoMode = settings.mode === ThemeModeSetting.Auto;

    const updateSettings = (newSettings: LumoLocalSettings) => {
        setSettings(newSettings);
        setLumoSettings(newSettings);
    };

    const setTheme = (newTheme: ThemeTypes) => {
        updateSettings({
            theme: newTheme,
            mode: newTheme === ThemeTypes.LumoDark ? ThemeModeSetting.Dark : ThemeModeSetting.Light,
        });
    };

    const setAutoTheme = (enabled: boolean) => {
        if (enabled) {
            updateSettings({ ...settings, mode: ThemeModeSetting.Auto });
        } else {
            const currentTheme = systemIsDark ? ThemeTypes.LumoDark : ThemeTypes.LumoLight;
            updateSettings({
                theme: currentTheme,
                mode: systemIsDark ? ThemeModeSetting.Dark : ThemeModeSetting.Light,
            });
        }
    };

    // Listen for system theme changes
    useLayoutEffect(() => {
        const mediaQuery = matchDarkTheme();
        const listener = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);

        mediaQuery.addEventListener?.('change', listener);
        return () => mediaQuery.removeEventListener?.('change', listener);
    }, []);

    // Apply theme styles and classes
    useLayoutEffect(() => {
        if (!isLumoDarkModeEnabled) return;

        document.body.classList.add(config.className);
        return () => document.body.classList.remove(config.className);
    }, [config.className, isLumoDarkModeEnabled]);

    return (
        <LumoThemeContext.Provider value={{ theme, setTheme, setAutoTheme, isDarkLumoTheme, isAutoMode }}>
            {isLumoDarkModeEnabled && <style id={LUMO_THEME_ID}>{config.styles}</style>}
            {children}
        </LumoThemeContext.Provider>
    );
};

export const useLumoTheme = () => useContext(LumoThemeContext);
