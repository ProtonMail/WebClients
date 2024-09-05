/* ⚠️ ⚠️ ⚠️
 * This is the only part of the extension codebase
 * still referencing the chrome.runtime API and that
 * is not yet "runtime agnostic" :
 * The storage.session API is only available in
 * chromium - still not supported for Firefox/Safari
 * extensions. Once FF has full MV3 support we can
 * safely port it to webextension-polyfill
 * ⚠️ ⚠️ ⚠️ */
import browser from '@proton/pass/lib/globals/browser';
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

const getItems: GetItems = (keys) => browser.storage.session.get(keys);
const getItem: GetItem = async (key) => (await getItems([key]))?.[key] ?? null;
const setItems: SetItems = (items) => browser.storage.session.set(items);
const setItem: SetItem = (key, value) => setItems({ [key]: value });
const removeItems: RemoveItems = (keys) => browser.storage.session.remove(keys);
const removeItem: RemoveItem = (key) => removeItems([key]);
const clear = (): Promise<void> => browser.storage.session.clear();

const browserSessionStorage: StorageInterface = {
    getItems,
    getItem,
    setItems,
    setItem,
    removeItems,
    removeItem,
    clear,
};

export default browser?.storage?.session === undefined ? createMemoryStorage() : browserSessionStorage;
