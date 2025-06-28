import { SETTINGS_STORAGE_KEY, getSettingsStorageKey } from 'proton-pass-web/lib/storage';

import { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import { createSettingsService } from '@proton/pass/lib/settings/service';
import type { ProxiedSettings } from '@proton/pass/store/reducers/settings';

/** Resolving the setting will wipe the non-indexed
 * `settings` storage when legacy settings still stored.  */
export const resolveSettings = (localID?: number): string => {
    if (localID === undefined) throw new Error('Missing LocalID');

    const settings = localStorage.getItem(getSettingsStorageKey(localID));
    const legacySettings = localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (legacySettings) {
        localStorage.removeItem(SETTINGS_STORAGE_KEY);
        return settings ?? legacySettings;
    }

    if (!settings) throw new Error('Settings not found');
    return settings;
};

export const settings = createSettingsService({
    clear: (localID) => localStorage.removeItem(getSettingsStorageKey(localID)),

    read: async (localID) => {
        const data = JSON.parse(resolveSettings(localID)) as ProxiedSettings;
        /** NOTE: This resolver only triggers for active sessions with valid settings.
         * Desktop onboarding bug allowed users to skip theme selection without saving.
         * For affected users with undefined theme, preserve previous default `PassDark` */
        if (data.theme === undefined) data.theme = PassThemeOption.PassDark;
        return data;
    },

    sync: (settings, localID) => {
        localStorage.setItem(getSettingsStorageKey(localID), JSON.stringify(settings));
    },
});
