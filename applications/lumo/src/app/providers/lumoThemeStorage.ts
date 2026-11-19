import { getLastUsedLocalID } from '@proton/account/bootstrap/lastUsedLocalID';
import { getLocalIDFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import { ThemeModeSetting, ThemeTypes } from '@proton/shared/lib/themes/constants';

import { isPublicPathname } from '../entrypoint/lumoRoutes';
import { matchDarkTheme } from './lumoThemeMedia';

export interface LumoLocalSettings {
    theme: ThemeTypes;
    mode: ThemeModeSetting;
    animatedBackgroundEnabled?: boolean;
    animatedBackgroundBlobMode?: 'ambient' | 'lavaLamp';
    dictationLanguage?: string;
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

const getLumoSettingsKey = (localID = getLocalID()) => {
    return localID ? `${LUMO_SETTINGS_KEY}:${localID}` : LUMO_SETTINGS_KEY;
};

/** Reads the settings of the session in the URL, or of `localID` when given. */
export const getLumoSettings = (localID?: string): LumoLocalSettings | null => {
    try {
        const storage = localStorage.getItem(getLumoSettingsKey(localID));
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
                if (
                    parsed.animatedBackgroundBlobMode === 'ambient' ||
                    parsed.animatedBackgroundBlobMode === 'lavaLamp'
                ) {
                    settings.animatedBackgroundBlobMode = parsed.animatedBackgroundBlobMode;
                }
                if (typeof parsed.dictationLanguage === 'string') {
                    settings.dictationLanguage = parsed.dictationLanguage;
                }
                return settings;
            }
        }
    } catch {
        // Ignore localStorage errors
    }
    return null;
};

/**
 * Settings to start with, before any session is resumed. On a private path without `/u/<localID>/`
 * (e.g. `/`), bootstrap resumes the last used session (`llid`) and then moves to `/u/<llid>/`, so read
 * that session's settings; otherwise the theme would switch after the move.
 */
export const getInitialLumoSettings = (): LumoLocalSettings | null => {
    const { pathname } = window.location;
    const lastUsedLocalID = getLastUsedLocalID();
    if (getLocalIDFromPathname(pathname) === undefined && !isPublicPathname(pathname) && lastUsedLocalID >= 0) {
        return getLumoSettings(String(lastUsedLocalID)) || getLumoSettings();
    }
    return getLumoSettings();
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
