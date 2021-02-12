export const getItem = (key: string, defaultValue: string) => {
    try {
        const value = window.sessionStorage.getItem(key);
        return value === null ? defaultValue : value;
    } catch (e) {
        return defaultValue;
    }
};

export const setItem = (key: string, value: string) => {
    try {
        window.sessionStorage.setItem(key, value);
    } catch (e) {
        return undefined;
    }
};

export const removeItem = (key: string) => {
    try {
        window.sessionStorage.removeItem(key);
    } catch (e) {
        return undefined;
    }
};

export const hasStorage = (key = 'test') => {
    try {
        window.sessionStorage.setItem(key, key);
        window.sessionStorage.removeItem(key);
        return true;
    } catch (e) {
        return false;
    }
};
