import { authStore } from '@proton/pass/lib/auth/store';
import { createSettingsService } from '@proton/pass/lib/settings/service';

export const LEGACY_SETTINGS_KEY = 'settings';

/** Get the appropriate settings key based on the environment
 * and localID. Desktop apps use the `LEGACY_SETTINGS_KEY`. */
export const getSettingsStorageKey = (localID?: number) =>
    localID !== undefined && !DESKTOP_BUILD ? `settings::${localID}` : LEGACY_SETTINGS_KEY;

export const resolveSettings = (): string => {
    const localID = authStore.getLocalID();
    const settings = localStorage.getItem(getSettingsStorageKey(localID));

    if (!DESKTOP_BUILD) {
        if (localID === undefined) throw new Error('Missing LocalID');

        /** For web, check for legacy settings and migrate if found */
        const legacySettings = localStorage.getItem(LEGACY_SETTINGS_KEY);

        if (legacySettings) {
            localStorage.removeItem(LEGACY_SETTINGS_KEY);
            return settings ?? legacySettings;
        }
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
