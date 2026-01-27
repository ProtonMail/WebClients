import cloneDeep from 'lodash/cloneDeep';

import { type ProxiedSettings, getInitialSettings } from '@proton/pass/store/reducers/settings';
import type { MaybeNull, MaybePromise } from '@proton/pass/types';
import { merge } from '@proton/pass/utils/object/merge';

export interface SettingsServiceOptions {
    clear: (localID?: number) => MaybePromise<void>;
    read: (localID?: number) => Promise<ProxiedSettings>;
    sync: (settings: ProxiedSettings, localID?: number) => MaybePromise<void>;
    onResolve?: (settings: ProxiedSettings, localID?: number) => void;
}

type SettingsServiceState = { settings: MaybeNull<ProxiedSettings> };
export interface SettingsService extends Pick<SettingsServiceOptions, 'clear' | 'sync'> {
    resolve: (localID?: number) => Promise<ProxiedSettings>;
}

export const createSettingsService = (options: SettingsServiceOptions): SettingsService => {
    const state: SettingsServiceState = { settings: null };

    return {
        clear: async (localID) => {
            state.settings = null;
            await options.clear(localID);
        },
        resolve: async (localID) => {
            state.settings =
                state.settings ??
                (await (async () => {
                    try {
                        const settings = await options.read(localID);
                        return merge(getInitialSettings(), settings ?? {});
                    } catch {
                        return getInitialSettings();
                    }
                })());

            return cloneDeep(state.settings);
        },

        sync: async (settings, localID) => {
            state.settings = cloneDeep(settings);
            await options.sync(settings, localID);
        },
    };
};
