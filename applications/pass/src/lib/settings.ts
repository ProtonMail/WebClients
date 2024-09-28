import { SETTINGS_STORAGE_KEY, getSettingsStorageKey } from 'proton-pass-web/lib/storage';

import { authStore } from '@proton/pass/lib/auth/store';
import { createSettingsService } from '@proton/pass/lib/settings/service';

/** Resolving the setting will wipe the non-indexed
 * `settings` storage when legacy settings still stored. This is
 * done outside  */
export const resolveSettings = (): string => {
    const localID = authStore.getLocalID();
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

/** Handles per-user settings on web and legacy settings on desktop.
 * Supports migration from legacy to per-user settings on web.*/
export const settings = createSettingsService({
    clear: () => localStorage.removeItem(getSettingsStorageKey(authStore.getLocalID())),

    resolve: () => JSON.parse(resolveSettings()),

    sync: (settings) => {
        const localID = authStore.getLocalID();
        localStorage.setItem(getSettingsStorageKey(localID), JSON.stringify(settings));
    },
});
