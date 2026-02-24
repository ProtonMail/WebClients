import { useCallback, useLayoutEffect, useState } from 'react';

import { ThemeTypes } from '@proton/shared/lib/themes/constants';

import { useLumoUserSettings } from '../hooks';
import { setLumoSettings } from './lumoThemeStorage';
import {
    createAutoThemeSettings,
    createThemeSettings,
    getLumoThemeFromSettings,
    getThemeConfig,
    matchDarkTheme,
    userSettingsToLocalSettings,
} from './lumoThemeUtils';

export const useLumoThemeLogic = () => {
    const [systemIsDark, setSystemIsDark] = useState(() => matchDarkTheme().matches);

    const { lumoUserSettings, updateSettings } = useLumoUserSettings();

    const localSettings = userSettingsToLocalSettings(lumoUserSettings, systemIsDark);

    // Calculate theme values from Redux state
    const theme = getLumoThemeFromSettings(localSettings, systemIsDark);
    const config = getThemeConfig(theme);
    const isDarkLumoTheme = theme === ThemeTypes.LumoDark;
    const isAutoMode = lumoUserSettings.theme === 'auto';

    // Simplified theme setters - only update Redux, which will handle localStorage via listeners
    const setTheme = useCallback(
        (newTheme: ThemeTypes) => {
            console.log('debug: useLumoThemeLogic setTheme', { newTheme, systemIsDark });

            const newSettings = createThemeSettings(newTheme);
            const themeValue = newTheme === ThemeTypes.LumoDark ? 'dark' : 'light';

            updateSettings({ theme: themeValue, _autoSave: true });

            // Update unencrypted localStorage directly for immediate consistency on load
            setLumoSettings(newSettings);
        },
        [updateSettings, systemIsDark]
    );

    const setAutoTheme = useCallback(
        (enabled: boolean) => {
            console.log('debug: useLumoThemeLogic setAutoTheme', { enabled, systemIsDark });

            const themeValue = enabled ? 'auto' : systemIsDark ? 'dark' : 'light';

            updateSettings({ theme: themeValue, _autoSave: true });

            // Update unencrypted localStorage directly for immediate consistency on load
            const newSettings = createAutoThemeSettings(enabled, systemIsDark);
            setLumoSettings(newSettings);
        },
        [updateSettings, systemIsDark]
    );

    // Listen for system theme changes
    useLayoutEffect(() => {
        const mediaQuery = matchDarkTheme();
        const listener = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);

        mediaQuery.addEventListener?.('change', listener);
        return () => mediaQuery.removeEventListener?.('change', listener);
    }, []);

    return {
        theme,
        setTheme,
        setAutoTheme,
        isDarkLumoTheme,
        isAutoMode,
        config,
    };
};
