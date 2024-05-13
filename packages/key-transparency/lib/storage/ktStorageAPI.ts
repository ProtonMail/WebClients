import { instance } from '@proton/cross-storage/account-impl/guestInstance';
import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import { KTLocalStorageAPI } from '@proton/shared/lib/interfaces';
import { getDefaultKTLS } from '@proton/shared/lib/keyTransparency';

/**
 * Return the set of functions to use account's local storage
 */
export const getKTLocalStorage = async (APP_NAME: APP_NAMES): Promise<KTLocalStorageAPI> => {
    if (APP_NAME === APPS.PROTONACCOUNT || APP_NAME === APPS.PROTONVPN_SETTINGS || !instance) {
        // If we are in account, or if the guest cross storage hasn't been setup, we use the app's local storage directly
        return getDefaultKTLS();
    }
    // Check if cross storage is available
    const crossStorageAvailable = await instance.supported();
    if (!crossStorageAvailable) {
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
