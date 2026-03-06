export function getItem<T extends string = string>(key: string): T | undefined;
export function getItem<T extends string = string, D extends T = T>(key: string, defaultValue: D): T;
export function getItem(key: string, defaultValue?: string) {
    try {
        const value = window.localStorage.getItem(key);
        return value === undefined ? defaultValue : value;
    } catch (e: any) {
        return defaultValue;
    }
}

const removeAfterTtl = (key: string, expiringTimeMS: number) => {
    setTimeout(() => {
        window.localStorage.removeItem(key);
    }, expiringTimeMS);
};

export const setItem = (key: string, value: string, args?: { ttl: number }) => {
    try {
        window.localStorage.setItem(key, value);
        if (args?.ttl) {
            removeAfterTtl(key, args.ttl);
        }
    } catch (e: any) {
        return undefined;
    }
};

export const removeItem = (key: string) => {
    try {
        window.localStorage.removeItem(key);
    } catch (e: any) {
        return undefined;
    }
};

export const hasStorage = (key = 'test') => {
    try {
        window.localStorage.setItem(key, key);
        window.localStorage.removeItem(key);
        return true;
    } catch (e: any) {
        return false;
    }
};

export const getKeys = () => {
    try {
        return Object.keys(window.localStorage);
    } catch (e: any) {
        return [];
    }
};
