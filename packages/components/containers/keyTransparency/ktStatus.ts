import { KT_DOMAINS, getBaseDomain, getKTLocalStorage, removeKTFromLS } from '@proton/key-transparency';
import { APP_NAMES } from '@proton/shared/lib/constants';
import { KTLocalStorageAPI } from '@proton/shared/lib/interfaces';

export enum KtFeatureEnum {
    DISABLE,
    ENABLE_CORE,
    ENABLE_UI,
}
export type KT_FF = KtFeatureEnum | undefined;

export const isKTActive = async (APP_NAME: APP_NAMES, feature: KT_FF) => {
    // Do not activate KT if
    //  - feature flag is off;
    //  - the api is not prod's or proton.black's
    //  - there is no access to cross-storage.
    //  - BigInt is not supported (it is needed for VRF verification);
    if (feature === undefined || feature === KtFeatureEnum.DISABLE) {
        return false;
    }

    const domain = getBaseDomain(false);
    if (domain === KT_DOMAINS.UNKNOWN) {
        return false;
    }

    try {
        // We only care about the difference between account and everything else
        const ls = getKTLocalStorage(APP_NAME);
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
