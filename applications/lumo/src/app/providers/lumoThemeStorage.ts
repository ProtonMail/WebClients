import { ThemeModeSetting, ThemeTypes } from '@proton/shared/lib/themes/constants';

import { matchDarkTheme } from './lumoThemeUtils';

export interface LumoLocalSettings {
    theme: ThemeTypes;
    mode: ThemeModeSetting;
    animatedBackgroundEnabled?: boolean;
}

const LUMO_SETTINGS_KEY = 'lumo-settings';

const getLocalID = (url = window.location.href): string | null => {
    try {
        const pathName = new URL(url).pathname;
        const match = pathName.match(/\/u\/(\d+)\//);
        return match ? match[1] : null;
    } catch {
        return null;
    }
};

const getLumoSettingsKey = () => {
    const localID = getLocalID();
    return localID ? `${LUMO_SETTINGS_KEY}:${localID}` : LUMO_SETTINGS_KEY;
};

export const getLumoSettings = (): LumoLocalSettings | null => {
    try {
        const storage = localStorage.getItem(getLumoSettingsKey());
        if (storage) {
            const parsed = JSON.parse(storage);
            if (parsed && typeof parsed.theme === 'number' && typeof parsed.mode === 'number') {
                const settings: LumoLocalSettings = {
                    theme: parsed.theme,
                    mode: parsed.mode,
                };
                if (typeof parsed.animatedBackgroundEnabled === 'boolean') {
                    settings.animatedBackgroundEnabled = parsed.animatedBackgroundEnabled;
                }
                return settings;
            }
        }
    } catch {
        // Ignore localStorage errors
    }
    return null;
};

/** Merges with existing `lumo-settings` so partial updates (theme or animated background) do not clobber each other. */
export const setLumoSettings = (patch: Partial<LumoLocalSettings>) => {
    try {
        const merged: LumoLocalSettings = {
            ...(getLumoSettings() || getDefaultSettings()),
            ...patch,
        };
        localStorage.setItem(getLumoSettingsKey(), JSON.stringify(merged));
    } catch {
        // Ignore localStorage errors
    }
};

export const getDefaultSettings = (): LumoLocalSettings => {
    return {
        theme: matchDarkTheme().matches ? ThemeTypes.LumoDark : ThemeTypes.LumoLight,
        mode: ThemeModeSetting.Auto,
    };
};
