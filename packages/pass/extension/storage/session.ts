/**
 * ⚠️ ⚠️ ⚠️
 * This is the only part of the extension codebase
 * still referencing the chrome.runtime API and that
 * is not yet "runtime agnostic" :
 * The storage.session API is only available in
 * chromium - still not supported for Firefox/Safari
 * extensions. Once FF has full MV3 support we can
 * safely port it to webextension-polyfill
 * ⚠️ ⚠️ ⚠️
 */
import { chromeAPI } from '@proton/pass/globals/browser';

import { createMemoryStorage } from './memory';
import type { Storage, StorageData } from './types';

const getItems = <T extends StorageData, K = keyof T>(keys: K[]): Promise<Partial<T>> =>
    new Promise((resolve, reject) => {
        chromeAPI.storage.session.get(keys, (items: any) => {
            let err = chromeAPI.runtime.lastError;
            if (err) {
                reject(err);
            } else {
                resolve(items);
            }
        });
    });

export const getItem = async <T extends StorageData, K extends keyof T = keyof T>(key: K): Promise<T[K] | null> => {
    try {
        return (await getItems<T>([key]))?.[key] ?? null;
    } catch (_) {
        return null;
    }
};

const setItems = <T extends StorageData>(items: Partial<T>): Promise<void> =>
    new Promise((resolve, reject) => {
        chromeAPI.storage.session.set(items, () => {
            let err = chromeAPI.runtime.lastError;
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });

export const setItem = <T extends StorageData, K extends keyof T = keyof T>(key: K, value: T[K]): Promise<void> =>
    setItems({ [key]: value });

export const removeItems = <T extends StorageData, K = keyof T>(keys: K[]): Promise<void> =>
    new Promise((resolve, reject) => {
        chromeAPI.storage.session.remove(keys as string[], () => {
            let err = chromeAPI.runtime.lastError;
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });

const removeItem = <T extends StorageData, K = keyof T>(key: K): Promise<void> => removeItems([key]);

const clear = (): Promise<void> => chromeAPI.storage.session.clear();

const chromeSessionStorage: Storage = {
    getItems,
    getItem,
    setItems,
    setItem,
    removeItems,
    removeItem,
    clear,
};

export default BUILD_TARGET === 'firefox' ? createMemoryStorage() : chromeSessionStorage;
