import { SETTINGS_STORAGE_KEY, getSettingsStorageKey } from 'proton-pass-web/lib/storage';

import { createSettingsService } from '@proton/pass/lib/settings/service';

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
    resolve: (localID) => JSON.parse(resolveSettings(localID)),
    sync: (settings, localID) => localStorage.setItem(getSettingsStorageKey(localID), JSON.stringify(settings)),
});
