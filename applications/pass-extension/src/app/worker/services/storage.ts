import { getExtensionLocalStorage, getExtensionSessionStorage } from '@proton/pass/lib/extension/storage';
import { fileStorageReady } from '@proton/pass/lib/file-storage/fs';
import type { ExtensionStorage, LocalStoreData, SessionStoreData } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array/first';
import { logger } from '@proton/pass/utils/logger';
import { isObject } from '@proton/pass/utils/object/is-object';
import noop from '@proton/utils/noop';

type StorageState = { storageFull: boolean };

export const createStorageService = () => {
    const localStorage = getExtensionLocalStorage<LocalStoreData>();
    const sessionStorage = getExtensionSessionStorage<SessionStoreData>();

    const state: StorageState = { storageFull: false };

    const handleStorageError = <T extends (...args: any[]) => Promise<any>>(fn: T) =>
        ((...args) =>
            fn(...args)
                .then((res) => {
                    state.storageFull = false;
                    return res;
                })
                .catch((err) => {
                    if (err instanceof Error) {
                        const message = err.message.toLowerCase();
                        if (
                            err.name === 'QuotaExceededError' ||
                            message.includes('quota') ||
                            message.includes('storage')
                        ) {
                            state.storageFull = true;
                        }
                    }

                    const keys = ((): string[] => {
                        const fst = first(args);
                        if (typeof fst === 'string') return [fst];
                        if (isObject(fst)) return Object.keys(fst);
                        return [];
                    })();

                    logger.warn(`[Storage::local] Failed writing ${keys.join(',')}`);
                })) as T;

    const local: ExtensionStorage<LocalStoreData> = {
        getItem: (key) => localStorage.getItem(key).catch(() => null),
        getItems: (keys) => localStorage.getItems(keys).catch(() => ({})),
        setItem: handleStorageError(localStorage.setItem),
        setItems: handleStorageError(localStorage.setItems),
        removeItem: (key) => localStorage.removeItem(key).catch(noop),
        removeItems: (keys) => localStorage.removeItems(keys).catch(noop),
        clear: () => localStorage.clear().catch(noop),
    };

    const session: ExtensionStorage<SessionStoreData> = {
        getItem: (key) =>
            sessionStorage
                .getItem(key)
                .then((value) => value ?? null)
                .catch(() => null),
        getItems: (keys) => sessionStorage.getItems(keys).catch(() => ({})),
        setItem: (key, value) => sessionStorage.setItem(key, value).catch(noop),
        setItems: (items) => sessionStorage.setItems(items).catch(noop),
        removeItem: (key) => sessionStorage.removeItem(key).catch(noop),
        removeItems: (keys) => sessionStorage.removeItems(keys).catch(noop),
        clear: () => sessionStorage.clear().catch(noop),
    };

    void fileStorageReady.then((instance) => {
        /** Clear file storage on service creation */
        instance.attachGarbageCollector(local);
        return instance.clearAll();
    });

    return { local, session, getState: () => state };
};

export type StorageService = ReturnType<typeof createStorageService>;
