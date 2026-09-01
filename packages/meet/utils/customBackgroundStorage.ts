import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';

const getStorageKey = (namespace: string | undefined) => (namespace ? `${namespace}.meetBackground` : undefined);

export const getPersistedCustomBackgroundId = (namespace: string | undefined): string | undefined => {
    const key = getStorageKey(namespace);

    return key ? (getItem(key) ?? undefined) : undefined;
};

export const persistCustomBackgroundId = (namespace: string | undefined, recordId: string) => {
    const key = getStorageKey(namespace);

    if (key) {
        setItem(key, recordId);
    }
};

export const clearPersistedCustomBackgroundId = (namespace: string | undefined) => {
    const key = getStorageKey(namespace);

    if (key) {
        removeItem(key);
    }
};
