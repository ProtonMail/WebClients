export const getItem = (key: string, defaultValue?: string) => {
    try {
        const value = window.localStorage.getItem(key);
        return value === undefined ? defaultValue : value;
    } catch (e: any) {
        return defaultValue;
    }
};

export const setItem = (key: string, value: string) => {
    try {
        window.localStorage.setItem(key, value);
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
