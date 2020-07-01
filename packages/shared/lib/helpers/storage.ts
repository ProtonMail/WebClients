export const getItem = (key: string, defaultValue?: string) => {
    try {
        const value = window.localStorage.getItem(key);
        return value === undefined ? defaultValue : value;
    } catch (e) {
        return defaultValue;
    }
};

export const setItem = (key: string, value: string) => {
    try {
        window.localStorage.setItem(key, value);
    } catch (e) {
        return undefined;
    }
};

export const removeItem = (key: string) => {
    try {
        window.localStorage.removeItem(key);
    } catch (e) {
        return undefined;
    }
};

export const hasStorage = (key = 'test') => {
    try {
        window.localStorage.setItem(key, key);
        window.localStorage.removeItem(key);
        return true;
    } catch (e) {
        return false;
    }
};
