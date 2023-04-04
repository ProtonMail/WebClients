import { instance } from '@proton/cross-storage/account-impl/guestInstance';
import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import { KTLocalStorageAPI } from '@proton/shared/lib/interfaces';
import { getDefaultKTLS } from '@proton/shared/lib/keyTransparency';

/**
 * Return the set of functions to use account's local storage
 */
export const getKTLocalStorage = (APP_NAME: APP_NAMES): KTLocalStorageAPI => {
    if (APP_NAME === APPS.PROTONACCOUNT || APP_NAME === APPS.PROTONVPN_SETTINGS) {
        // If we are in account, we use its local storage directly
        return getDefaultKTLS();
    }
    // Otherwise we access it via cross-storage
    return {
        getItem: async (key: string) => instance.getLocalStorage(key),
        setItem: async (key: string, value: string) => instance.setLocalStorage(key, value),
        removeItem: async (key: string) => instance.removeLocalStorage(key),
        getBlobs: () => instance.getLocalStorageKeys().then((keys) => keys || []),
    };
};
