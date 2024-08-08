import { type ProxiedSettings, getInitialSettings } from '@proton/pass/store/reducers/settings';
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
                return merge(getInitialSettings(), await options.resolve());
            } catch {
                return getInitialSettings();
            }
        },
        sync: options.sync,
    };
};
