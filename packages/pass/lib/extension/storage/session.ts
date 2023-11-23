/* ⚠️ ⚠️ ⚠️
 * This is the only part of the extension codebase
 * still referencing the chrome.runtime API and that
 * is not yet "runtime agnostic" :
 * The storage.session API is only available in
 * chromium - still not supported for Firefox/Safari
 * extensions. Once FF has full MV3 support we can
 * safely port it to webextension-polyfill
 * ⚠️ ⚠️ ⚠️ */
import { chromeAPI } from '@proton/pass/lib/globals/browser';
import type {
    GetItem,
    GetItems,
    RemoveItem,
    RemoveItems,
    SetItem,
    SetItems,
    StorageInterface,
} from '@proton/pass/types';

import { createMemoryStorage } from './memory';

const getItems: GetItems = (keys) =>
    new Promise((resolve, reject) => {
        chromeAPI.storage.session.get(keys, (items) => {
            const err = chromeAPI.runtime.lastError;
            return err ? reject(err) : resolve(items);
        });
    });

export const getItem: GetItem = async (key) => (await getItems([key]))?.[key] ?? null;

const setItems: SetItems = (items) =>
    new Promise((resolve, reject) => {
        chromeAPI.storage.session.set(items, () => {
            const err = chromeAPI.runtime.lastError;
            return err ? reject(err) : resolve();
        });
    });

export const setItem: SetItem = (key, value) => setItems({ [key]: value });

export const removeItems: RemoveItems = (keys) =>
    new Promise((resolve, reject) => {
        chromeAPI.storage.session.remove(keys, () => {
            const err = chromeAPI.runtime.lastError;
            return err ? reject(err) : resolve();
        });
    });

const removeItem: RemoveItem = (key) => removeItems([key]);

const clear = (): Promise<void> => chromeAPI.storage.session.clear();

const chromeSessionStorage: StorageInterface = {
    getItems,
    getItem,
    setItems,
    setItem,
    removeItems,
    removeItem,
    clear,
};

export default BUILD_TARGET === 'firefox' ? createMemoryStorage() : chromeSessionStorage;
