import { type ProxiedSettings, getInitialSettings } from '@proton/pass/store/reducers/settings';
import type { MaybePromise } from '@proton/pass/types';
import { merge } from '@proton/pass/utils/object/merge';

export interface SettingsServiceConfig {
    clear: (localID?: number) => MaybePromise<void>;
    read: (localID?: number) => Promise<ProxiedSettings>;
    sync: (settings: ProxiedSettings, localID?: number) => MaybePromise<void>;
}

export interface SettingsService extends SettingsServiceConfig {
    resolve: (localID?: number) => Promise<ProxiedSettings>;
}

export const createSettingsService = (options: SettingsServiceConfig): SettingsService => {
    return {
        clear: options.clear,
        read: options.read,
        resolve: async (localID) => {
            try {
                const settings = await options.read(localID);
                return merge(getInitialSettings(), settings ?? {});
            } catch {
                return getInitialSettings();
            }
        },
        sync: options.sync,
    };
};
