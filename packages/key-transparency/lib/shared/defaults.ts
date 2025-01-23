import { getItem, removeItem, setItem } from '@proton/shared/lib/helpers/storage';
import type { KTLocalStorageAPI, KeyTransparencyState } from '@proton/shared/lib/interfaces';

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
