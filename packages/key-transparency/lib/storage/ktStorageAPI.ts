import { instance } from '@proton/cross-storage/account-impl/guestInstance';
import { APPS, APP_NAMES } from '@proton/shared/lib/constants';
import { KTLocalStorageAPI } from '@proton/shared/lib/interfaces';
import { getDefaultKTLS } from '@proton/shared/lib/keyTransparency';

const isCrossStorageAvailable = ((): (() => Promise<boolean>) => {
    let crossStorageAvailable: Promise<boolean> | undefined;
    return async () => {
        if (crossStorageAvailable === undefined) {
            crossStorageAvailable = (async () => {
                try {
                    const test = 'kttest';
                    await instance.setLocalStorage(test, test);
                    await instance.removeLocalStorage(test);
                    return true;
                } catch (error) {
                    return false;
                }
            })();
        }
        return crossStorageAvailable;
    };
})();

/**
 * Return the set of functions to use account's local storage
 */
export const getKTLocalStorage = async (APP_NAME: APP_NAMES): Promise<KTLocalStorageAPI> => {
    if (APP_NAME === APPS.PROTONACCOUNT || APP_NAME === APPS.PROTONVPN_SETTINGS) {
        // If we are in account, we use its local storage directly
        return getDefaultKTLS();
    }
    // Check if cross storage is available
    const crossStorageAvailable = await isCrossStorageAvailable();
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
