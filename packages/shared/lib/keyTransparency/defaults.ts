import { getItem, removeItem, setItem } from '../helpers/storage';
import { KTLocalStorageAPI, KeyTransparencyState } from '../interfaces';

/**
 * Return the default set of functions to use local storage,
 * i.e. those of the currently running subdomain
 */
export const getDefaultKTLS = (): KTLocalStorageAPI => {
    return {
        getItem: async (key: string) => getItem(key),
        setItem: async (key: string, value: string) => setItem(key, value),
        removeItem: async (key: string) => removeItem(key),
        getBlobs: async () => Object.keys(window.localStorage),
    };
};

export const defaultKeyTransparencyState: KeyTransparencyState = {
    selfAuditResult: undefined,
};
