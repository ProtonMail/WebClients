import { serverTime } from '@proton/crypto';
import { KT_DATA_VALIDITY_PERIOD, KT_DOMAINS, ctLogs, getBaseDomain } from '@proton/key-transparency';
import { HOUR } from '@proton/shared/lib/constants';
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
    //  - BigInt is only partially implemented and does not support -- (it is needed for VRF verification)
<<<<<<< HEAD
    //  - the hardcoded KT certificate data is older than 6 months.
    //  - the server time compared to the client time is off by more than 24 hours -- (UI warning is shown to prevent attacks)
    //  - Webcrypto is only partially supported (it is needed for certificate verification in pki.js)
=======
    //  - Web Crypto isn't fully supported (it is needed for certificate verification in pki.js)
>>>>>>> 4fa6c29937 (Simplify check for web crypto)
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

    if (typeof BigInt === 'undefined') {
        return false;
    }

    try {
        // Test if the -- operand is supported by BigInt
        // because it is used by VRF verification.
        let check = BigInt('0x1'); // eslint-disable-line @typescript-eslint/no-unused-vars
        check--; // eslint-disable-line @typescript-eslint/no-unused-vars
    } catch {
        return false;
    }

    const ctLogTimestamp = new Date(ctLogs.log_list_timestamp);
    const keyTransparencyDataAge = serverTime().getTime() - ctLogTimestamp.getTime();
    if (keyTransparencyDataAge > KT_DATA_VALIDITY_PERIOD) {
        return false;
    }
    
    const timeOffset = serverTime().getTime() - Date.now();
    if (Math.abs(timeOffset) > 24 * HOUR) {
        return false;
    }

    // Test for full Web Crypto support, required by pki.js
    if (typeof crypto === 'undefined' || !('subtle' in crypto)) {
        return false;
    }

    return true;
};
