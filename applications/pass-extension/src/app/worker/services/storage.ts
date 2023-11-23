import { browserLocalStorage, browserSessionStorage } from '@proton/pass/lib/extension/storage';
import type {
    GetItems,
    LocalStoreData,
    LocalStoreKeys,
    RemoveItems,
    SessionStoreData,
    SessionStoreKeys,
    SetItems,
    Storage,
    StorageInterface,
    StorageKeys,
} from '@proton/pass/types';
import noop from '@proton/utils/noop';

type StorageState = { storageFull: boolean };
export interface ExtensionStorage<T, K extends StorageKeys<T>> extends Storage<T, K> {
    remove: (key: StorageKeys<T>) => Promise<void>;
    getItems: GetItems<T, K[]>;
    setItems: SetItems<T>;
    removeItems: RemoveItems<T>;
}

export const createStorageService = () => {
    const localStorage = browserLocalStorage as StorageInterface<LocalStoreData>;
    const sessionStorage = browserSessionStorage as StorageInterface<SessionStoreData>;

    const state: StorageState = { storageFull: false };

    const local: ExtensionStorage<LocalStoreData, LocalStoreKeys> = {
        getItem: (key) => localStorage.getItem(key).catch(() => null),
        getItems: (keys) => localStorage.getItems(keys).catch(() => ({})),
        setItem: (key, value: string) =>
            localStorage
                .setItem(key, value)
                .then((result) => {
                    state.storageFull = false;
                    return result;
                })
                .catch(() => {
                    state.storageFull = true;
                }),
        setItems: (items) => localStorage.setItems(items).catch(noop),
        remove: (key) => localStorage.removeItem(key).catch(noop),
        removeItems: (keys) => localStorage.removeItems(keys).catch(noop),
        clear: () => localStorage.clear().catch(noop),
    };

    const session: ExtensionStorage<SessionStoreData, SessionStoreKeys> = {
        getItem: (key) =>
            sessionStorage
                .getItem(key)
                .then((value) => value ?? null)
                .catch(() => null),
        getItems: (keys) => sessionStorage.getItems(keys).catch(() => ({})),
        setItem: (key, value) => sessionStorage.setItem(key, value).catch(noop),
        setItems: (items) => sessionStorage.setItems(items).catch(noop),
        remove: (key) => sessionStorage.removeItem(key).catch(noop),
        removeItems: (keys) => sessionStorage.removeItems(keys).catch(noop),
        clear: () => sessionStorage.clear().catch(noop),
    };

    return { local, session, getState: () => state };
};

export type StorageService = ReturnType<typeof createStorageService>;
