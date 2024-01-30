import { createSettingsService } from '@proton/pass/lib/settings/service';

const SettingsLocalStorageKey = 'settings';

export const settings = createSettingsService({
    clear: () => localStorage.removeItem(SettingsLocalStorageKey),
    resolve: () => {
        const settings = localStorage.getItem(SettingsLocalStorageKey);
        if (!settings) throw new Error('settings not found');
        return JSON.parse(settings);
    },
    sync: (settings) => localStorage.setItem(SettingsLocalStorageKey, JSON.stringify(settings)),
});
