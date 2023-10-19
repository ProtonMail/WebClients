import { KT_DOMAINS, getBaseDomain } from '@proton/key-transparency';
import { APP_NAMES } from '@proton/shared/lib/constants';

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
    //  - BigInt is not supported (it is needed for VRF verification);
    if (feature === undefined || feature === KtFeatureEnum.DISABLE) {
        return false;
    }

    const domain = getBaseDomain(false);
    if (domain === KT_DOMAINS.UNKNOWN) {
        return false;
    }

    return typeof BigInt !== 'undefined';
};
