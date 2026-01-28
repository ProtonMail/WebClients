import cloneDeep from 'lodash/cloneDeep';

import { type ProxiedSettings, getInitialSettings } from '@proton/pass/store/reducers/settings';
import type { MaybePromise } from '@proton/pass/types';
import { merge } from '@proton/pass/utils/object/merge';

export interface SettingsServiceOptions {
    clear: (localID?: number) => MaybePromise<void>;
    read: (localID?: number) => Promise<ProxiedSettings>;
    sync: (settings: ProxiedSettings, localID?: number) => MaybePromise<void>;
}

export interface SettingsService extends Pick<SettingsServiceOptions, 'clear' | 'sync'> {
    resolve: (localID?: number) => Promise<ProxiedSettings>;
    state: Map<number, ProxiedSettings>;
}

/** When account switching is available: use the localID
 * else fallback to -1 for clients not supporting switch */
const getSettingsKey = (localID?: number) => localID ?? -1;

export const createSettingsService = (options: SettingsServiceOptions): SettingsService => {
    const state: Map<number, ProxiedSettings> = new Map();

    return {
        state,

        clear: async (localID) => {
            state.delete(getSettingsKey(localID));
            await options.clear(localID);
        },

        resolve: async (localID) => {
            const key = getSettingsKey(localID);

            const settings =
                state.get(key) ??
                (await (async () => {
                    try {
                        const settings = await options.read(localID);
                        return merge(getInitialSettings(), settings ?? {});
                    } catch {
                        return getInitialSettings();
                    }
                })());

            state.set(key, settings);
            return cloneDeep(settings);
        },

        sync: async (settings, localID) => {
            state.set(getSettingsKey(localID), cloneDeep(settings));
            await options.sync(settings, localID);
        },
    };
};
