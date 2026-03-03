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

/** `browser.storage.session` may be unavailable in Firefox extension iframes.
 * Firefox handles extension frames in a content process instead of a privileged
 * extension process, so iframes only get content-script-level API access. This
 * is blocked on Firefox shipping out-of-process iframes for extensions.
 * See https://bugzilla.mozilla.org/show_bug.cgi?id=1443253 */
export default browser?.storage?.session === undefined ? createMemoryStorage() : browserSessionStorage;
