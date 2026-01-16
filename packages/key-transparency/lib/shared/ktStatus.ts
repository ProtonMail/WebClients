import { serverTime } from '@proton/crypto';
import { HOUR } from '@proton/shared/lib/constants';

import { KT_DOMAINS } from '../constants/constants';
import { getBaseDomain } from '../helpers/utils';

const importCertificates = () =>
    import(
        /* webpackChunkName: "kt-certificates" */
        '../constants/certificates'
    );

export enum KtFeatureEnum {
    DISABLE,
    ENABLE_CORE,
    ENABLE_UI,
}

export type KT_FF = KtFeatureEnum | undefined;

export const isKTActive = async (feature: KT_FF) => {
    const { KT_DATA_VALIDITY_PERIOD, ctLogs } = await importCertificates();

    // Do not activate KT if
    //  - feature flag is off;
    //  - the api is not prod's or proton.black's
    //  - the hardcoded KT certificate data is older than 6 months.
    //  - the server time compared to the client time is off by more than 24 hours -- (UI warning is shown to prevent attacks)
    //  - Web Crypto isn't fully supported (it is needed for certificate verification in pki.js)
    if (feature === undefined || feature === KtFeatureEnum.DISABLE) {
        return false;
    }

    const domain = getBaseDomain(false);
    if (domain === KT_DOMAINS.UNKNOWN) {
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
