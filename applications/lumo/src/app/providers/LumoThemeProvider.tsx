import { type FC, type PropsWithChildren, createContext, useContext, useLayoutEffect, useState } from 'react';

import { ThemeTypes } from '@proton/shared/lib/themes/constants';
import useFlag from '@proton/unleash/useFlag';

// @ts-ignore
import lumoDarkTheme from '@proton/colors/themes/dist/lumo-dark.theme.css';
// @ts-ignore
import lumoLightTheme from '@proton/colors/themes/dist/lumo-light.theme.css';

export const LUMO_THEME_ID = 'lumo-theme';

// Use the official ThemeTypes enum
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

// Local storage helpers - similar to wallet implementation
const LUMO_SETTINGS_KEY = 'lumo-settings';

export interface LumoLocalSettings {
    theme: ThemeTypes;
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
            // Validate that theme is a valid ThemeTypes value
            if (
                parsed &&
                typeof parsed.theme === 'number' &&
                (parsed.theme === ThemeTypes.LumoLight || parsed.theme === ThemeTypes.LumoDark)
            ) {
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
    isDarkLumoTheme: boolean;
}>({
    theme: getLumoDefaultTheme(),
    setTheme: () => {},
    isDarkLumoTheme: false,
});

export const LumoThemeProvider: FC<PropsWithChildren> = ({ children }) => {
    const isLumoDarkModeEnabled = useFlag('LumoDarkMode');
    const [theme, setThemeState] = useState<ThemeTypes>(() => {
        const settings = getLumoSettings();
        return settings?.theme ?? getLumoDefaultTheme();
    });
    const [config, setConfig] = useState<ThemeConfig>(getThemeConfig(theme));

    const setTheme = (newTheme: ThemeTypes) => {
        setThemeState(newTheme);
        // Save full settings object like wallet
        const currentSettings = getLumoSettings() || { theme: getLumoDefaultTheme() };
        setLumoSettings({ ...currentSettings, theme: newTheme });
    };

    const isDarkLumoTheme = theme === ThemeTypes.LumoDark;

    useLayoutEffect(() => {
        if (isLumoDarkModeEnabled) {
            setConfig(getThemeConfig(theme));
        }
    }, [theme, isLumoDarkModeEnabled]);

    useLayoutEffect(() => {
        if (isLumoDarkModeEnabled) {
            document.body.classList.add(config.className);
            return () => document.body.classList.remove(config.className);
        }
    }, [config, isLumoDarkModeEnabled]);

    return (
        <LumoThemeContext.Provider value={{ theme, setTheme, isDarkLumoTheme }}>
            {isLumoDarkModeEnabled && <style id={LUMO_THEME_ID}>{config.styles}</style>}
            {children}
        </LumoThemeContext.Provider>
    );
};

export const useLumoTheme = () => useContext(LumoThemeContext);
