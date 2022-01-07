export const setTestKeyValue = (window: Window) => {
    try {
        window.localStorage.setItem('cs', '1');
    } catch (e: any) {
        return undefined;
    }
};

export const getIsSupported = (value: any) => {
    return value === '1';
};

export const getTestKeyValue = (window: Window) => {
    try {
        return window.localStorage.getItem('cs');
    } catch (e: any) {
        return undefined;
    }
};
