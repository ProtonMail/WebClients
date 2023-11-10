import { KT_DOMAINS, getBaseDomain } from '@proton/key-transparency';
import { isIos11, isSafari11 } from '@proton/shared/lib/helpers/browser';

export enum KtFeatureEnum {
    DISABLE,
    ENABLE_CORE,
    ENABLE_UI,
}
export type KT_FF = KtFeatureEnum | undefined;

export const isKTActive = (feature: KT_FF) => {
    // Do not activate KT if
    //  - feature flag is off;
    //  - the api is not prod's or proton.black's
    //  - safari 11 or ios 11 is used due to issues with the CryptoProxy
    //  - BigInt is not supported (it is needed for VRF verification);
    if (feature === undefined || feature === KtFeatureEnum.DISABLE) {
        return false;
    }

    const domain = getBaseDomain(false);
    if (domain === KT_DOMAINS.UNKNOWN) {
        return false;
    }

    if (isSafari11() || isIos11()) {
        return false;
    }

    return typeof BigInt !== 'undefined';
};
