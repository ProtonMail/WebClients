/* As we do not have access to the session storage API
 * in Firefox add-ons : we'll use a memory storage "mock"
 * relying on a global "store" initialized in the background
 * page. This memory storage will behave differently based on
 * the extension context. In the background page : it will
 * mimic the storage API by directly accessing a "storage" context
 * variable while maintaining the same method signatures (get/
 * set/remove/clear). In any other context (popup, content-scripts
 * etc..) we will rely on the runtime's bi-directional messaging
 * capabilities in order to access or mutate the "storage" context
 * which only lives in the background page context.
 * This gives us the benefit of not having to modify existing code
 * to handle Firefox specifics when dealing with the session API */
import browser from '@proton/pass/lib/globals/browser';
import type {
    GetItem,
    GetItems,
    Maybe,
    RemoveItem,
    RemoveItems,
    SetItem,
    SetItems,
    StorageInterface,
} from '@proton/pass/types';
import noop from '@proton/utils/noop';

const MEMORY_STORAGE_EVENT = 'MEMORY_STORAGE_EVENT';

type MemoryStore = Record<string, any>;

type StorageAction =
    | { action: 'get' }
    | { action: 'set'; items: Partial<MemoryStore> }
    | { action: 'remove'; keys: string[] }
    | { action: 'clear' };

type StorageMessage = { type: typeof MEMORY_STORAGE_EVENT } & StorageAction;

const isStorageMessage = (message: any): message is StorageMessage => message.type === MEMORY_STORAGE_EVENT;

const isBackground = async (): Promise<boolean> => {
    try {
        return (await browser.runtime.getBackgroundPage()) === window;
    } catch (_) {
        return false;
    }
};

export const createMemoryStorage = (): StorageInterface => {
    const context: { store: MemoryStore } = { store: {} };

    const applyStorageAction = <Action extends StorageAction['action']>(
        action: Extract<StorageAction, { action: Action }>
    ) =>
        browser.runtime
            .sendMessage<StorageMessage, Action extends 'get' ? Maybe<Storage> : undefined>(browser.runtime.id, {
                type: MEMORY_STORAGE_EVENT,
                ...action,
            })
            .catch(noop);

    const resolveStorage = async (): Promise<Maybe<MemoryStore>> =>
        (await isBackground()) ? context.store : applyStorageAction<'get'>({ action: 'get' });

    const getItems: GetItems = async (keys) => {
        const store = await resolveStorage();
        return keys.reduce(
            (result, key) => ({
                ...result,
                ...(store?.[key] !== undefined ? { [key]: store?.[key] } : {}),
            }),
            {}
        );
    };

    const getItem: GetItem = async (key) => {
        const store = await resolveStorage();
        return store?.[key] ?? null;
    };

    const setItems: SetItems = async (items) => {
        if (!(await isBackground())) return applyStorageAction<'set'>({ action: 'set', items });
        context.store = { ...context.store, ...items };
    };

    const setItem: SetItem = async (key, value) => setItems({ [key]: value });

    const removeItems: RemoveItems = async (keys) => {
        if (!(await isBackground())) return applyStorageAction<'remove'>({ action: 'remove', keys });
        keys.forEach((key) => delete context.store[key]);
    };

    const removeItem: RemoveItem = (key) => removeItems([key]);

    const clear = async (): Promise<void> => {
        if (!(await isBackground())) return applyStorageAction({ action: 'clear' });
        context.store = {};
    };

    /* setup context forwarding via
     * extension messaging if in background */
    isBackground()
        .then((inBackgroundPage) => {
            if (inBackgroundPage) {
                browser.runtime.onMessage.addListener((message) => {
                    if (isStorageMessage(message)) {
                        switch (message.action) {
                            case 'get':
                                return Promise.resolve(context.store);
                            case 'set':
                                return setItems(message.items);
                            case 'remove':
                                return removeItems(message.keys);
                            case 'clear':
                                return clear();
                        }
                    }
                });
            }
        })
        .catch(noop);

    return {
        getItems,
        getItem,
        setItems,
        setItem,
        removeItems,
        removeItem,
        clear,
    };
};
