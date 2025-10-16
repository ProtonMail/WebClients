import { ThemeModeSetting, ThemeTypes } from '@proton/shared/lib/themes/constants';

export interface LumoLocalSettings {
    theme: ThemeTypes;
    mode: ThemeModeSetting;
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
                return parsed;
            }
        }
    } catch {
        // Ignore localStorage errors
    }
    return null;
};

export const setLumoSettings = (settings: LumoLocalSettings) => {
    console.log('debug: setLumoSettings - trying to update local settings', settings);
    try {
        localStorage.setItem(getLumoSettingsKey(), JSON.stringify(settings));
    } catch {
        // Ignore localStorage errors
        console.log('debug: setLumoSettings error', settings);
    }
};

export const getDefaultSettings = (): LumoLocalSettings => ({
    theme: ThemeTypes.LumoLight,
    mode: ThemeModeSetting.Light,
});
