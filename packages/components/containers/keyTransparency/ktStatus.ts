import { getKTLocalStorage, removeKTFromLS } from '@proton/key-transparency';
import { APPS } from '@proton/shared/lib/constants';
import { getHostname } from '@proton/shared/lib/helpers/url';
import { KTLocalStorageAPI } from '@proton/shared/lib/interfaces';

export enum KT_FF {
    DISABLE,
    ENABLE_CORE,
    ENABLE_UI,
}

export const isKTActive = async (feature?: KT_FF) => {
    // Do not activate KT if
    //  - feature flag is off;
    //  - BigInt is not supported (it is needed for VRF verification);
    //  - there is no access to cross-storage.
    if (feature === KT_FF.DISABLE) {
        return false;
    }

    try {
        // We only care about the difference between account and everything else
        const ls = getKTLocalStorage(
            getHostname(window.location.href).indexOf('account') !== -1 ? APPS.PROTONACCOUNT : APPS.PROTONMAIL
        );
        const test = 'KTTEST';
        await ls.setItem(test, test);
        const receivedTest = await ls.getItem(test);
        await ls.removeItem(test);
        if (receivedTest !== test) {
            return false;
        }
    } catch (error: any) {
        return false;
    }

    return typeof BigInt !== 'undefined';
};

export const removeKTBlobs = async (userID: string, addressIDs: string[], ktLSAPI: KTLocalStorageAPI) => {
    for (const addressID of addressIDs) {
        try {
            await removeKTFromLS(userID, addressID, ktLSAPI);
        } catch (error: any) {
            continue;
        }
    }
};
