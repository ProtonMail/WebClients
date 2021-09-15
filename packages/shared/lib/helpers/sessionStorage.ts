export const getItem = (key: string, defaultValue?: string) => {
    try {
        const value = window.sessionStorage.getItem(key);
        return value === null ? defaultValue : value;
    } catch (e: any) {
        return defaultValue;
    }
};

export const setItem = (key: string, value: string) => {
    try {
        window.sessionStorage.setItem(key, value);
    } catch (e: any) {
        return undefined;
    }
};

export const removeItem = (key: string) => {
    try {
        window.sessionStorage.removeItem(key);
    } catch (e: any) {
        return undefined;
    }
};

export const hasStorage = (key = 'test') => {
    try {
        window.sessionStorage.setItem(key, key);
        window.sessionStorage.removeItem(key);
        return true;
    } catch (e: any) {
        return false;
    }
};
