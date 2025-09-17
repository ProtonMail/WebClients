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

const getItems: GetItems = async (keys) => browser.storage.local.get(keys);
const getItem: GetItem = async (key) => (await getItems([key]))?.[key] ?? null;
const setItems: SetItems = async (items) => browser.storage.local.set(items);
const setItem: SetItem = async (key, value) => setItems({ [key]: value });
const removeItems: RemoveItems = async (keys) => browser.storage.local.remove(keys);
const removeItem: RemoveItem = async (key) => removeItems([key]);
const clear = async (): Promise<void> => browser.storage.local.clear();

const browserLocalStorage: StorageInterface = {
    getItems,
    getItem,
    setItems,
    setItem,
    removeItems,
    removeItem,
    clear,
};

export default browserLocalStorage;
