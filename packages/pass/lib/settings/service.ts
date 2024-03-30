import { authStore } from '@proton/pass/lib/auth/store';
import { INITIAL_SETTINGS, type ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { MaybePromise } from '@proton/pass/types';
import { merge } from '@proton/pass/utils/object/merge';

export type SettingsOptions = {
    clear: () => MaybePromise<void>;
    resolve: () => MaybePromise<ProxiedSettings>;
    sync: (settings: ProxiedSettings) => MaybePromise<void>;
};

export type SettingsService = ReturnType<typeof createSettingsService>;

export const createSettingsService = (options: SettingsOptions) => {
    return {
        clear: options.clear,
        resolve: async () => {
            try {
                const settings = merge(INITIAL_SETTINGS, await options.resolve());

                /** If offline support was disabled while the user was offline,
                 * update the `offlineEnabled` property based on the actual
                 * authentication store value */
                settings.offlineEnabled = authStore.getOfflineConfig() !== undefined;

                return settings;
            } catch {
                return INITIAL_SETTINGS;
            }
        },
        sync: options.sync,
    };
};
