import { type ProxiedSettings, getInitialSettings } from '@proton/pass/store/reducers/settings';
import type { MaybePromise } from '@proton/pass/types';
import { merge } from '@proton/pass/utils/object/merge';

export interface SettingsService {
    clear: (localID?: number) => MaybePromise<void>;
    resolve: (localID?: number) => Promise<ProxiedSettings>;
    sync: (settings: ProxiedSettings, localID?: number) => MaybePromise<void>;
}

export const createSettingsService = (options: SettingsService): SettingsService => {
    return {
        clear: options.clear,
        resolve: async (localID) => {
            try {
                const settings = await options.resolve(localID);
                return merge(getInitialSettings(), settings ?? {});
            } catch {
                return getInitialSettings();
            }
        },
        sync: options.sync,
    };
};
