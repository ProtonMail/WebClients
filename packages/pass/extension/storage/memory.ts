/**
 * As we do not have access to the session storage API
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
 * to handle Firefox specifics when dealing with the session API.
 */
import browser from '@proton/pass/globals/browser';
import noop from '@proton/utils/noop';

import type { Storage, StorageData } from './types';

const MEMORY_STORAGE_EVENT = 'MEMORY_STORAGE_EVENT';

type StorageAction<T extends StorageData = StorageData, K extends keyof T = keyof T> =
    | { action: 'get' }
    | { action: 'set'; items: Partial<T> }
    | { action: 'remove'; keys: K[] }
    | { action: 'clear' };

type StorageMessage<T extends StorageData = StorageData> = { type: typeof MEMORY_STORAGE_EVENT } & StorageAction<T>;

const isStorageMessage = <T extends StorageData>(message: any): message is StorageMessage<T> =>
    message.type === MEMORY_STORAGE_EVENT;

const isBackground = async (): Promise<boolean> => {
    try {
        return (await browser.runtime.getBackgroundPage()) === window;
    } catch (_) {
        return false;
    }
};

export const createMemoryStorage = (): Storage => {
    const context: { store: any } = { store: {} };

    const applyStorageAction = <T extends StorageData, Action extends StorageAction<T>['action']>(
        action: Extract<StorageAction<T>, { action: Action }>
    ): Promise<Action extends 'get' ? T : void> =>
        browser.runtime.sendMessage(browser.runtime.id, { type: MEMORY_STORAGE_EVENT, ...action });

    const resolveStorage = async <T extends StorageData>(): Promise<T> =>
        (await isBackground()) ? (context.store as T) : applyStorageAction<T, 'get'>({ action: 'get' });

    const getItems = async <T extends StorageData, K extends keyof T = keyof T>(keys: K[]): Promise<Partial<T>> => {
        const store = await resolveStorage();
        return keys.reduce(
            (result, key) => ({
                ...result,
                ...((store as T)?.[key] !== undefined ? { [key]: (store as T)?.[key] } : {}),
            }),
            {}
        );
    };

    const getItem = async <T extends StorageData, K extends keyof T = keyof T>(key: K): Promise<T[K] | null> => {
        const store = await resolveStorage();
        return Promise.resolve((store as T)?.[key] ?? null);
    };

    const setItems = async <T extends StorageData>(items: Partial<T>): Promise<void> => {
        if (!(await isBackground())) {
            return applyStorageAction<T, 'set'>({ action: 'set', items });
        }

        context.store = { ...context.store, ...items };
    };

    const setItem = async <T extends StorageData, K extends keyof T = keyof T>(key: K, value: T[K]): Promise<void> =>
        setItems({ [key]: value });

    const removeItems = async <T extends StorageData, K extends keyof T = keyof T>(keys: K[]): Promise<void> => {
        if (!(await isBackground())) {
            return applyStorageAction<T, 'remove'>({ action: 'remove', keys });
        }

        keys.forEach((key) => delete context.store[key]);
    };

    const removeItem = async <T extends StorageData, K extends keyof T = keyof T>(key: K): Promise<void> =>
        removeItems<T>([key]);

    const clear = async (): Promise<void> => {
        if (!(await isBackground())) {
            return applyStorageAction({ action: 'clear' });
        }

        context.store = {};
    };

    /**
     * setup context forwarding via
     * extension messaging if in background
     */
    isBackground()
        .then((inBackgroundPage) => {
            if (inBackgroundPage) {
                browser.runtime.onMessage.addListener((message): any => {
                    if (isStorageMessage(message)) {
                        switch (message.action) {
                            case 'get':
                                return Promise.resolve(context.store);
                            case 'set':
                                return setItems(message.items);
                            case 'remove':
                                return removeItems(message.keys as string[]);
                            case 'clear':
                                return clear();
                        }
                    }

                    return false;
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
    } as Storage;
};
