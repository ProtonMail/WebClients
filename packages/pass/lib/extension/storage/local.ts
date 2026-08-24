import type {
    ClearItems,
    GetItem,
    GetItems,
    RemoveItem,
    RemoveItems,
    SetItem,
    SetItems,
    StorageInterface,
} from '../../../types';
import { notIn } from '../../../utils/fp/predicates';
import browser from '../../globals/browser';

const getItems: GetItems = async (keys) => browser.storage.local.get(keys);
const getItem: GetItem = async (key) => (await getItems([key]))?.[key] ?? null;
const setItems: SetItems = async (items) => browser.storage.local.set(items);
const setItem: SetItem = async (key, value) => setItems({ [key]: value });
const removeItems: RemoveItems = async (keys) => browser.storage.local.remove(keys);
const removeItem: RemoveItem = async (key) => removeItems([key]);
const clear: ClearItems = async (options) => {
    if (!options || options.preserve.length === 0) return browser.storage.local.clear();
    else {
        const store = await browser.storage.local.get();
        const keysToRemove = Object.keys(store).filter(notIn(options.preserve));
        return browser.storage.local.remove(keysToRemove);
    }
};

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
