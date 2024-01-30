import { INITIAL_SETTINGS, type ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { MaybePromise } from '@proton/pass/types';

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
                return await options.resolve();
            } catch {
                return INITIAL_SETTINGS;
            }
        },
        sync: options.sync,
    };
};
