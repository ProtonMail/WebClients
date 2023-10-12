import { noop } from 'lodash';

import { browserLocalStorage, browserSessionStorage } from '@proton/pass/lib/extension/storage';
import type { StorageInterface, StorageQuery } from '@proton/pass/lib/extension/storage/types';
import {
    type LocalStoreData,
    type LocalStoreKeys,
    type SessionStoreData,
    type SessionStoreKeys,
} from '@proton/pass/types';

type StorageState = { storageFull: boolean };

export const createStorageService = () => {
    const local = browserLocalStorage as StorageInterface<LocalStoreData>;
    const session = browserSessionStorage as StorageInterface<SessionStoreData>;
    const state: StorageState = { storageFull: false };

    return {
        local: {
            get: <K extends LocalStoreKeys[]>(keys: K): Promise<StorageQuery<LocalStoreData, K>> =>
                local.getItems(keys).catch(() => ({})),

            /* if a local storage `setter` action throws, it likely
             * means that we either reached the max quota or the user
             * does not have any disk space left */
            set: async (data: Partial<LocalStoreData>) => {
                local
                    .setItems(data)
                    .then((result) => {
                        state.storageFull = false;
                        return result;
                    })
                    .catch(() => (state.storageFull = true));
            },

            unset: (keys: LocalStoreKeys[]) => local.removeItems(keys).catch(noop),
            clear: () => local.clear().catch(noop),
        },

        session: {
            get: <K extends SessionStoreKeys[]>(keys: K): Promise<StorageQuery<SessionStoreData, K>> =>
                session.getItems(keys).catch(() => ({})),
            set: (data: Partial<SessionStoreData>) => session.setItems(data).catch(noop),
            unset: (keys: SessionStoreKeys[]) => session.removeItems(keys).catch(noop),
            clear: () => session.clear().catch(noop),
        },

        getState: () => state,
    };
};

export type StorageService = ReturnType<typeof createStorageService>;
