import { INITIAL_SETTINGS, type ProxiedSettings } from '@proton/pass/store/reducers/settings';
import type { MaybePromise } from '@proton/pass/types';
import { merge } from '@proton/pass/utils/object/merge';

export interface SettingsService {
    clear: () => MaybePromise<void>;
    resolve: () => Promise<ProxiedSettings>;
    sync: (settings: ProxiedSettings) => MaybePromise<void>;
}

export const createSettingsService = (options: SettingsService): SettingsService => {
    return {
        clear: options.clear,
        resolve: async () => {
            try {
                return merge(INITIAL_SETTINGS, await options.resolve());
            } catch {
                return INITIAL_SETTINGS;
            }
        },
        sync: options.sync,
    };
};
