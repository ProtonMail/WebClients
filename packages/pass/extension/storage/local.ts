import browser from '@proton/pass/globals/browser';

import type { Storage, StorageData } from './types';

const getItems = <T extends StorageData, K = keyof T>(keys: K[]) =>
    browser.storage.local.get(keys) as Promise<Partial<T>>;

const getItem = async <T extends StorageData, K extends keyof T = keyof T>(key: K): Promise<T[K] | null> =>
    (await getItems<T>([key]))?.[key] ?? null;

const setItems = <T extends StorageData>(items: T): Promise<void> => browser.storage.local.set(items);

const setItem = <T extends StorageData, K extends keyof T = keyof T>(key: K, value: T[K]): Promise<void> =>
    setItems({ [key]: value });

const removeItems = <T extends StorageData, K = keyof T>(keys: K[]): Promise<void> =>
    browser.storage.local.remove(keys as string[]);

const removeItem = <T extends StorageData, K = keyof T>(key: K): Promise<void> => removeItems([key]);

const clear = (): Promise<void> => browser.storage.local.clear();

const browserLocalStorage: Storage = {
    getItems,
    getItem,
    setItems,
    setItem,
    removeItems,
    removeItem,
    clear,
};

export default browserLocalStorage;
